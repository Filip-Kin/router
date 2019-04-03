import { connect, query } from './util/database';
import { Logger } from './util/logger';
const log = new Logger('Init', 'white');
import { load } from './util/config';
import { startServer } from './api';
import { startRouter } from './router';
import { timer } from './util/timer';
let conf = load()

let start = new Date();
log.log('Initializing Kiwahosting Router/API');
log.log('Connecting to database');
connect(conf).then(conn => {
    timer(start, 'Connecting to the database took');
    query(conn, 'SHOW TABLES;')
    .then(async (rows) => { 
        //log.debug('Tables in database: '+rows['Tables_in_'+conf.database.database].join(', ')); 
        log.log('Initializing Router');
        await startRouter(conn);
        log.log('Initializing API Server');
        await startServer(conn);
        timer(start, 'Initialization took');
        log.log('Initialization complete, Hello Kiwa!');
    });
}).catch(err => {
    log.error('Aborting initialization');
});
