import * as uuid from 'uuidv4';
import { requireInput } from '../util/api';
import { query } from '../util/database';
import { timer } from '../util/timer';
import { Logger } from '../util/logger';
import { sendMail } from '../util/email';
import { getDevice, createDevice, emailInUse } from '../util/auth';
let log = new Logger('API:auth', 'cyan');

export const auth = {
    signup: {
        post: (req, res, conn) => {
           if (!requireInput(req.body, {password: 64, email: 255, firstName: 255, lastName: 255})) {
                // 1: Invalid request
                log.debug('Rejecting POST /auth/signup: 1');
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
                log.debug('Rejecting POST /auth/signup: 2');
                res.send({status: 2})
                timer(req['start'], 'Request took');
            });
        }
    },
    device: {
        post: (req, res, conn) => {
            if (!requireInput(req.body, {device: 36})) {
                // 1: Invalid request
                log.debug('Rejecting GET /auth/device: 1');
                res.send({status: 1});
                timer(req['start'], 'Request took');
                return;
            }
            getDevice(conn, req.body.device).then(status => {
                if (status === 0) {
                    // 0: Successful Request
                    log.debug('Resolving GET /auth/device: 0');
                    res.send({status: 0});
                    timer(req['start'], 'Request took');
                } else {
                    // 9: Device does not exist
                    log.debug('Rejecting GET /auth/device: 9');
                    res.send({status: 9});
                    timer(req['start'], 'Request took');
                }
            }).catch(err => {
                // 2: SQL Error
                log.debug('Rejecting GET /auth/device: 2');
                res.send({status: 2});
                timer(req['start'], 'Request took');
            });
        },
        get: (req, res, conn) => {
            createDevice(conn).then(did => {
                // 0: Device id added
                log.debug('Resolving POST /auth/device: 0');
                res.send({status: 0, device: did});
                timer(req['start'], 'Request took');
            }).catch(err => {
                // 2: SQL error
                log.debug('Rejecting POST /auth/device: 2');
                res.send({status: 2});
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
                log.debug('Rejecting GET /auth/email: 1');
                res.send({status: 1});
                timer(req['start'], 'Request took');
                return;
            }
            emailInUse(conn, req.body.email).then(result => {
                // 0: Email not in use
                // 3: Email in use
                let status = 0
                if (result) status = 3;
                log.debug('Resolve GET /auth/email: '+status);
                res.send({status: status});
                timer(req['start'], 'Request took');
            }).catch(err => {
                // 2: SQL error
                log.debug('Rejecting GET /auth/email: 2');
                res.send({status: 2});
                timer(req['start'], 'Request took');
            });
        },
        post: (req, res, conn) => { // Verify
            if (!requireInput(req.body, {code: 36})) {
                // 1: Invalid request
                log.debug('Rejecting POST /auth/email: 1');
                res.send({status: 1});
                timer(req['start'], 'Request took');
                return;
            }
            query(conn, 'SELECT * FROM `emailVerification` WHERE `uuid` = "'+req.body.code+'";').then(rows => {
                if (JSON.stringify(rows) === '[]') {
                    // 4: Invalid code
                    log.debug('Rejecting POST /auth/email: 4');
                    res.send({status: 4});
                    timer(req['start'], 'Request took');
                } else if ((new Date()).getTime() > rows[0]['expires']) {
                    // 5: Code expired
                    log.debug('Rejecting POST /auth/email: 5');
                    res.send({status: 5});
                    timer(req['start'], 'Request took');
                } else {
                    query(conn, 'UPDATE `users` SET `lastLogin` = 0 WHERE `uuid` = "'+rows[0]['user']+'";').then(result => {
                        query(conn, 'DELETE FROM `emailVerification` WHERE `uuid` = "'+req.body.code+'";').then(result => {
                            // 0: Account verified
                            log.debug('Resolving POST /auth/email: 0');
                            res.send({status: 0});
                            timer(req['start'], 'Request took');
                        }).catch(err => {
                            // 2: SQL error
                            log.debug('Rejecting POST /auth/email: 2');
                            res.send({status: 2});
                            timer(req['start'], 'Request took');
                        });
                    }).catch(err => {
                        // 2: SQL error
                        log.debug('Rejecting POST /auth/email: 2');
                        res.send({status: 2});
                        timer(req['start'], 'Request took');
                    });
                }
            }).catch(err => {
                // 2: SQL error
                log.debug('Rejecting POST /auth/email: 2');
                res.send({status: 2});
                timer(req['start'], 'Request took');
            });
            // 8: Unimplemented
            res.send({status: 8});
        },
        put: (req, res, conn, conf) => { // Get new email
            if (!requireInput(req.body, {email: 255, user: 36})) {
                // 1: Invalid request
                log.debug('Rejecting PUT /auth/email: 1');
                res.send({status: 1});
                timer(req['start'], 'Request took');
                return;
            }
            let code = uuid();
            let expires = (new Date()).getTime() + (24*60*60*1000);
            query(conn, 'INSERT INTO `emailVerification` (`uuid`, `user`, `email`, `expires`) '+
            'VALUES ("'+code+'", "'+req.body.user+'", "'+req.body.email+'", '+expires+');').then(result => {
                sendMail({
                    to: req.body.email,
                    subject: 'Verify email address',
                    html: '<h1>Welcome</h1><p>'+code+'</p>'
                }, conf).then(() => {
                    // 0: Successful request
                    log.debug('Resolving PUT /auth/email: 0');
                    res.send({status: 0});
                    timer(req['start'], 'Request took');
                }).catch(err => {
                    // 6: Email server rejected authentication
                    // 7: Email failed to send
                    log.debug('Rejecting PUT /auth/email: '+err);
                    res.send({status: err});
                    timer(req['start'], 'Request took');
                });
            }).catch(err => {
                // 2: SQL error
                log.debug('Rejecting PUT /auth/email: 2');
                res.send({status: 2});
                timer(req['start'], 'Request took');
            });
        }
    }
};
