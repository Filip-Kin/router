import { createConnection } from 'mysql';
import { timer } from './timer';
import { Logger } from './logger';
const log = new Logger('SQL', 'green');
import { load } from './config';
let conf = load()
let cache = {};

export function connect() {
    return new Promise((resolve, reject) => {
        let conn = createConnection(conf.database);
        conn.connect((err) => {
            if (err) { log.error(err.message); return reject(err); };
            /* IDK what data structure will be like yet
            // Create tables if they don't exist yet
            tables.forEach(function(sql) {
                query(conn, sql).then();
            });
            */
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
