import { connect, query } from './util/database';
import { load } from './util/config';
import { startServer } from './api';
import { startRouter } from './router';
import { timer } from './util/timer';
import { Logger } from './util/logger';
const log = new Logger('Init', 'white');

log.log('Initializing Kiwahosting Router/API');
let start = new Date();
log.log('Loading config');
load().then(conf => {
    log.log('Connecting to database');
    connect(conf).then(conn => {
        timer(start, 'Connecting to the database took');
        query(conn, 'SHOW TABLES;')
        .then(async (rows) => {
            log.log('Initializing Router');
            await startRouter(conn, conf);
            log.log('Initializing API Server');
            await startServer(conn, conf);
            timer(start, 'Initialization took');
            log.log('Initialization complete, Hello Kiwa!');
        });
    }).catch(err => {
        log.error('Aborting initialization');
    });
});

