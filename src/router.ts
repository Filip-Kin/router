import { createServer } from 'http';
import { createProxyServer } from 'http-proxy';
import { timer } from './util/timer';
import { query } from './util/database';
import { Logger } from './util/logger';
let log = new Logger('Router', 'magenta');

export async function startRouter(conn=null, conf) {
    let test = (conn===null);
    let start = new Date();
    return await new Promise((resolve, reject) => {
        let port = conf.ports[(conf.secure) ? 'sslRouter':'router'];

        // Create proxy object
        let proxy = createProxyServer({});

        // Catch errors
        proxy.on('error', function (err, req, res) {
            res.write('<html><body><h2>Something went wrong!</h2><p>' + err.message + '</p></body></html>');
            res.end();
        });

        // Custom request handler
        try {
            createServer(function (req, res) {
                let start = new Date();
                let domain = req.headers.host;
                if (domain.startsWith('www.')) domain = domain.substring(4);
                let ip = req.connection.remoteAddress;
                log.log('\n' + ip.replace('::ffff:', '') + ' --> ' + domain);

                // Handle internal requests
                if (domain.endsWith(conf.domain)) {
                    for (let subdomain of ['docs', 'api', 'mysql', '']) {
                        if (domain === subdomain+conf.domain) {
                            if (subdomain === '') subdomain = 'frontend';
                            proxy.web(req, res, { changeOrigin: true, target: (conf.secure)?'https':'http'+'://'+conf.addresses[subdomain] });
                            log.log('`-----> ' + subdomain + '|');
                        }
                    }
                } else if (!test) {
                    // Handle client requests
                    let sql = "SELECT * FROM `domains` WHERE `name` = '" + domain + "'";
                    query(conn, sql).then(function(rows) {
                        if (rows == undefined) {
                            log.log('rows undefined');
                            res.write('<html><body><h2>Domain not connected to site</h2>');
                            res.write('<p>If you own this domain, make sure its added in the dashboard</p></body></html>');
                            res.end();
                        } else {
                            let row = rows[0];
                            if (row == undefined) {
                                log.log('disconnected site');
                                res.write('<html><body><h2>Domain not connected to site</h2>');
                                res.write('<p>If you own this domain, make sure its added in the dashboard</p></body></html>');
                                res.end();
                            } else {
                                let path = (conf.secure)?'https':'http'+'://' + row.server + ':' + row.port + row.path;
                                log.log('`-----> ' + row.siteid + ' - ' + path + ' |');
                                proxy.web(req, res, {target: path});
                            }
                        }
                        timer(start, 'Proxy took');
                    }).catch(function(err) {
                        res.write(err.message);
                        res.end();
                        timer(start, 'Proxy took');
                    });
                } else {
                    switch (domain) {
                        case 'test1': {
                            log.log('rows undefined');
                            res.write('<html><body><h2>Domain not connected to site</h2>');
                            res.write('<p>If you own this domain, make sure its added in the dashboard</p></body></html>');
                            res.end();
                        }
                        case 'test2': {
                            let path = (conf.secure)?'https':'http'+'://127.0.0.1:8080';
                            log.log('`-----> ' + 'test2' + ' - ' + path + ' |');
                            proxy.web(req, res, {target: path});
                        }
                    }
                }
            }).listen(port)
        } catch (err) {
            if (err) {
                log.error(err.message);
                return reject();
            }
        }
        log.log('Router started on '+((conf.secure)?'https':'http')+'://127.0.0.1:' + port);
        timer(start, 'Starting the router took');
        return resolve();
    });
}

export async function test(sm) {
    //await startRouter();
}
