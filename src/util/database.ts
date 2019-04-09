import { createConnection } from 'mysql';
import { timer } from './timer';
import { Logger } from './logger';
const log = new Logger('SQL', 'green');
let cache = {};
let conf;

export function generate(conn) {
    let tables = ['CREATE TABLE IF NOT EXISTS `users` ('+
        '`uuid` VARCHAR(36),'+
        '`firstName` VARCHAR(255),'+
        '`lastName` VARCHAR(255),'+
        '`email` VARCHAR(255),'+
        '`phone` VARCHAR(15),'+
        '`password` VARCHAR(64),'+
        '`signup` TIMESTAMP DEFAULT NOW(),'+
        '`lastLogin` TIMESTAMP NULL DEFAULT NULL,'+
        'PRIMARY KEY (`uuid`)'+
    ') ENGINE=InnoDB;',
    'CREATE TABLE IF NOT EXISTS `domains` ('+
        '`uuid` VARCHAR(36),'+
        '`site` VARCHAR(36),'+
        '`domain` VARCHAR(255),'+
        '`path` VARCHAR(255),'+
        '`server` VARCHAR(255),'+
        'PRIMARY KEY (`uuid`)'+
    ') ENGINE=InnoDB;',
    'CREATE TABLE IF NOT EXISTS `devices` ('+
        '`uuid` VARCHAR(36),'+
        '`user` VARCHAR(36),'+
        'PRIMARY KEY (`uuid`)'+
    ') ENGINE=InnoDB;',
    'CREATE TABLE IF NOT EXISTS `emailVerification` ('+
        '`uuid` VARCHAR(36),'+
        '`user` VARCHAR(36),'+
        '`email` VARCHAR(255),'+
        '`expires` DATETIME DEFAULT NOW(),'+
        'PRIMARY KEY (`uuid`)'+
    ') ENGINE=InnoDB'];
    tables.forEach(sql => {
        log.debug(sql);
        query(conn, sql, false).catch(err => {log.warn('Failed table generation')});
    });
}

export function connect(config) {
    conf=config;
    return new Promise((resolve, reject) => {
        let conn = createConnection(conf.database);
        conn.connect((err) => {
            if (err && err.message === 'connect ECONNREFUSED 127.0.0.1:3306') {
                log.error('ECONNREFUSED 127.0.0.1:3306');
                log.debug('Make sure you have your Google Cloud proxy running');
                return reject(err);
            } else if (err) { log.error(err.message); return reject(err); };
            generate(conn);
            log.log('Database connected')
            return resolve(conn);
        });
    });
}

export function query(conn, sql, useCache=true) {
    let start = new Date();
    return new Promise(function(resolve, reject) {
        // Check if I should use cache and if this query has been run before
        if (useCache && Object.keys(cache).toString().includes(sql)) {
            // Check if I should remove cached result from the cache
            if (cache[sql].expires > new Date().getTime()) {
                timer(start, 'SQL cache took');
                return resolve(cache[sql].result);
            } else {
                delete cache[sql];
            }
        }
        // Check if I should remove a cached result which will
        // be changed by the query I'm about to run
        if (/(DELETE|INSERT|UPDATE)/.test(sql)) {
            let sqlMatch = sql.match(/(DELETE|INSERT|UPDATE).+`(.+)`.+(['"].+['"])/);
            let sqlRegex = new RegExp(".+", sqlMatch[4]);
            let removeFromCache = Object.keys(cache).filter(function(a) {return sqlRegex.test(a)});
            removeFromCache.forEach(function(key) {
                delete cache[key];
                log.debug('Deleted related query from cache')
            });
        }

        // Actually run the error
        conn.query(sql, function(err, rows) {
            if (err) { log.error(err.message); reject(err); }
            resolve(rows);
            log.debug(JSON.stringify(rows));
            // Check to see if I should cache this result
            let table = sql.match(/SELECT (.+) FROM `(.+)` WHERE .+/);
            if (sql.startsWith('SELECT') && Object.keys(conf.caching).toString().includes(table[2])) {
                let expires = new Date().getTime() + (1000*conf.caching[table[2]]);
                cache[sql] = { result: rows, expires: expires };
                let expiresDate = new Date(expires);
                log.debug('This query will be cached until '+expiresDate.getHours()+':'+expiresDate.getMinutes()+':'+expiresDate.getSeconds());
            }
        });
    });
}
