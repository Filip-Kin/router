import * as express from 'express';
import { json as parseBody } from 'body-parser';
import { timer } from './util/timer';
import { Logger } from './util/logger';
let log = new Logger('API', 'cyan');

import { index } from './api/index';
import { auth } from './api/auth';

export function startServer(conn?, port = 8080) {
    return new Promise((resolve, reject) => {
        let start = new Date();
        const app = express();
        app.use((req, res, next) => { req['start'] = new Date(); next(); });
        app.use(parseBody());
    
        app.get('/', (req, res) => index.get(req, res));
    
        app.post('/auth/signup', (req, res) => auth.signup.post(req, res, conn));
        app.post('/auth/verify', (req, res) => auth.verify.post(req, res, conn));

        app.listen(port, () => {
            log.log('API started at http://127.0.0.1:'+port);
            timer(start, 'Starting the API server took');
            return resolve();
        });
    });
}

export async function test(sm) {
    try {
        await startServer();
    } catch(err) {
        return false;
    }
    return true;
}