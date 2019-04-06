import * as uuid from 'uuidv4';
import { requireInput } from '../util/api';
import { query } from '../util/database';
import { timer } from '../util/timer';
import { Logger } from '../util/logger';
import { sendMail } from '../util/email';
let log = new Logger('API:auth', 'cyan');

export const auth = {
    signup: {
        post: (req, res, conn) => {
           if (!requireInput(req.body, {password: 64, email: 255, firstName: 255, lastName: 255})) {
                // 1: Invalid request
                log.warn('Rejecting POST /auth/signup: 1');
                res.send({status: 1});
                timer(req['start'], 'Request took');
                return;
           }
           let id = uuid();
           log.debug('Creating user with uuid: '+id);
           query(conn, "INSERT INTO `users`"+
            "(`uuid`, `firstName`, `lastName`, `email`, `phone`, `password`, `signup`, `lastLogin`) VALUES "+
            `('${id}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.email}', NULL, `+
            `'${req.body.password}', NOW(), NULL);`).then(() => {
                // 0: Successful request
                log.debug('Resolving POST /auth/signup: 0');
                res.send({status: 0})
                timer(req['start'], 'Request took');
            }).catch(err => {
                // 2: SQL error
                log.warn('Rejecting POST /auth/signup: 2');
                res.send({status: 2})
                timer(req['start'], 'Request took');
            });
        }
    },
    verify: {
        post: (req, res, conn) => {
            // TODO: Verify
            // 8: Unimplemented
            res.send({status: 8});
        }
    },
    email: {
        get: (req, res, conn) => { // Check if email is in use
            if (!requireInput(req.params, {email: 255})) {
                // 1: Invalid request
                log.warn('Rejecting GET /auth/email: 1');
                res.send({status: 1});
                timer(req['start'], 'Request took');
                return;
            }
            query(conn, 'SELECT * FROM `users` WHERE `email`="'+req.body.email+'"').then(rows => {
                let status = 0;
                // 0: Email not in use
                // 3: Email in use
                if (JSON.stringify(rows) !== '[]') status = 3;
                log.debug('Resolve GET /auth/email: '+status);
                res.send({status: status});
                timer(req['start'], 'Request took');
            }).catch(err => {
                // 2: SQL error
                log.warn('Rejecting GET /auth/email: 2');
                res.send({status: 2});
                timer(req['start'], 'Request took');
            });
        },
        post: (req, res, conn) => { // Verify
            // TODO: Everything
            // 8: Unimplemented
            res.send({status: 8});
        },
        put: (req, res, conn, conf) => { // Get new email
            if (!requireInput(req.body, {email: 255})) {
                // 1: Invalid request
                log.warn('Rejecting POST /auth/email: 1');
                res.send({status: 1});
                timer(req['start'], 'Request took');
                return;
            }
            sendMail({
                to: req.body.email,
                subject: 'Verify email address',
                html: '<h1>Welcome</h1><p>That was easy!</p>'
            }, conf).then(() => {
                // 0: Successful request
                log.debug('Resolving PUT /auth/email: 0');
                res.send({status: 0});
                timer(req['start'], 'Request took');
            }).catch(err => {
                // 6: Email server rejected authentication
                // 7: Email failed to send
                log.warn('Rejecting PUT /auth/email: '+err);
                res.send({status: err});
                timer(req['start'], 'Request took');
            });
        }
    }
};
