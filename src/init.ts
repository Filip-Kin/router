import { connect, query } from './util/database';
import { Logger } from './util/logger';
const log = new Logger('Init', 'white');
import { load } from './util/config';
let conf = load()

log.log('Initializing Kiwahosting Router/API');
connect(conf).then(conn => {
    query(conn, 'SHOW TABLES;')
    .then((rows) => { 
        //log.debug('Tables in database: '+rows['Tables_in_'+conf.database.database].join(', ')); 
    });
}).catch(err => {
    log.error('Aborting initialization');
});
