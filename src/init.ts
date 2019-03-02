import { connect, query } from './util/database';
import { Logger } from './util/logger';
const log = new Logger('Init', 'white');

log.log('Initializing Kiwahosting Router/API');
connect().then(conn => {
    query(conn, 'SHOW TABLES;')
    .then((rows) => { 
        log.log(JSON.stringify(rows)); 
    });
});
