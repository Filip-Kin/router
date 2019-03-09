import { connect, query } from './util/database';
import { Logger } from './util/logger';
const log = new Logger('Init', 'white');
import { load } from './util/config';
import { startServer } from './api';
import { startRouter } from './router';
let conf = load()

log.log('Initializing Kiwahosting Router/API');
log.log('Connecting to database');
connect(conf).then(conn => {
    query(conn, 'SHOW TABLES;')
    .then(async (rows) => { 
        //log.debug('Tables in database: '+rows['Tables_in_'+conf.database.database].join(', ')); 
        log.log('Initializing Router');
        await startRouter(conn);
    });
}).catch(err => {
    log.error('Aborting initialization');
});
