import * as uuid from 'uuidv4';
import { requireInput } from '../util/api';
import { query } from '../util/database';
import { timer } from '../util/timer';
import { Logger } from '../util/logger';
let log = new Logger('API:auth', 'cyan');

export const auth = {
    signup: {
        post: (req, res, conn) => {
           if (!requireInput(req.body, {password: 64, email: 255, firstName: 255, lastName: 255})) {
               log.debug('Rejecting POST /auth/signup: 1');
               res.send({status: 0, error: 1});
               timer(req['start'], 'Request took');
               return;
           }
           let id = uuid();
           log.debug('Creating user with uuid: '+id);
           query(conn, "INSERT INTO `users`"+
            "(`uuid`, `firstName`, `lastName`, `email`, `phone`, `password`, `signup`, `lastLogin`) VALUES "+
            `('${id}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.email}', NULL, `+
            `'${req.body.password}', NOW(), NULL);`).then(() => {
                res.send({status: 1})
                log.debug('Resolving POST /auth/signup: 0');
                timer(req['start'], 'Request took');
            }).catch(err => {
                log.debug('Rejecting POST /auth/signup: 2');
                res.send({status: 0, error: 2})
                timer(req['start'], 'Request took');
            });
        }
    },
    verify: {
        post: (req, res, conn) => {
            res.send(req.body);
        }
    }
};
