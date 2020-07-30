import { createServer } from 'http';
import { createProxyServer } from 'http-proxy';
import * as cf from 'node_cloudflare';
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
        proxy.on('error', (err, req, res) => {
            res.write('<html><body><h2>Something went wrong!</h2><p>' + err.message + '</p></body></html>');
            res.end();
        });

        // Custom request handler
        try {
            let server = createServer((req, res) => {
                let start = new Date();
                let domain = req.headers.host;
                if (domain === conf.domain) domain = 'www.' + domain;
                let ip = (cf.check(req))? cf.get(req):req.connection.remoteAddress;
                ip = ip.replace('::ffff:', '127.0.0.1').replace('::1', '127.0.0.1');
                req.headers['origin-ip'] = ip;
                log.log(ip + ' --> ' + domain);

                // Handle internal requests
                if (domain.endsWith(conf.domain)) {
                    for (let subdomain of ['docs', 'api', 'mysql', 'www']) {
                        if (domain === subdomain+'.'+conf.domain) {
                            if (subdomain === 'www') subdomain = 'frontend';
                            proxy.web(req, res, { changeOrigin: true, target: (conf.secure)?'https':'http'+'://'+conf.addresses[subdomain] });
                            log.log(subdomain);
                            timer(start, 'Proxy took');
                        }
                    }
                } else if (!test) {
                    // Handle client requests
                    let sql = "SELECT * FROM `domains` WHERE `domain` = '" + domain + "'";
                    query(conn, sql).then(rows => {
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
                                log.log(row.siteid + ' - ' + path + ' |');
                                proxy.web(req, res, {target: path});
                            }
                        }
                        timer(start, 'Proxy took');
                    }).catch(err => {
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
                            log.log('test2' + ' - ' + path + ' |');
                            proxy.web(req, res, {target: path});
                        }
                    }
                }
            })
            cf.load((err, fs_err) => {
                if (fs_err) {
                    throw new Error(fs_err);
                }
                server.listen(port);
            });
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
