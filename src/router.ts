import { createServer } from 'http';
import { createProxyServer } from 'http-proxy';
import { timer } from './util/timer';

let c = {config:{ports:{proxy:0,sslProxy:0,frontend:0,docs:0,mysql:0,api:0,}}}

export async function startProxy(database, type) {

    let port = (type === 'http') ? c.config.ports.proxy : c.config.ports.sslProxy;

    // Create proxy object
    let proxy = createProxyServer({});

    // Catch errors
    proxy.on('error', function (err, req, res) {
        res.write('<html><body><h2>Something went wrong!</h2>');
        res.write('<p>' + err.message + '</p></body></html>');
        res.end();
    });

    // Custom request handler
    createServer(function (req, res) {

        let start = new Date();
        let domain = req.headers.host;
        if (domain.startsWith('www.')) domain = domain.substring(4);
        let ip = req.connection.remoteAddress;
        console.log('\n' + ip.replace('::ffff:', '') + ' --> ' + domain);

        // Handle internal requests
        if (domain === 'docs.kiwahosting.com') {
            proxy.web(req, res, {target: type+'://127.0.0.1:'+c.config.ports.docs});
            console.log('`-----> ' + 'docs' + '|');
            timer(start, 'Proxy took');
        } else if ( domain === 'api.kiwahosting.com') {
            proxy.web(req, res, {target: type+'://127.0.0.1:'+c.config.ports.api});
            console.log('`-----> ' + 'API' + '|');
            timer(start, 'Proxy took');
        } else if ( domain === 'mysql.kiwahosting.com') {
            proxy.web(req, res, {target: type+'://127.0.0.1:'+c.config.ports.mysql});
            console.log('`-----> ' + 'mysql' + '|');
            timer(start, 'Proxy took');
        } else if ( domain === 'kiwahosting.com' || domain === 'www.kiwahosting.com') {
            proxy.web(req, res, {target: type+'://127.0.0.1:'+c.config.ports.frontend});
            console.log('`-----> ' + 'frontend' + '|');
            timer(start, 'Proxy took');
        } else {
            // Handle client requests
            let sql = "SELECT * FROM `domains` WHERE `name` = '" + domain + "'";
            database.query(sql).then(function(rows) {
                if (rows == undefined) {
                    console.log('rows undefined');
                    res.write('<html><body><h2>Domain not connected to site</h2>');
                    res.write('<p>If you own this domain, make sure its added in the dashboard</p></body></html>');
                    res.end();
                } else {
                    let row = rows[0];
                    if (row == undefined) {
                        console.log('disconnected site');
                        res.write('<html><body><h2>Domain not connected to site</h2>');
                        res.write('<p>If you own this domain, make sure its added in the dashboard</p></body></html>');
                        res.end();
                    } else {
                        let path = type+'://' + row.server + ':' + row.port + row.path;
                        console.log('`-----> ' + row.siteid + ' - ' + path + ' |');
                        proxy.web(req, res, {target: path});
                    }
                }
                timer(start, 'Proxy took');
            }).catch(function(err) {
                res.write(err.message);
                res.end();
                timer(start, 'Proxy took');
            });
        }
    }).listen(port);

    console.info('Proxy server started on '+type+'://127.0.0.1:' + port);
}
