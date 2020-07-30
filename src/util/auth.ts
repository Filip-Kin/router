import * as uuid from 'uuidv4';
import * as sha1 from 'sha1';
import { query } from './database';
import { Logger } from './logger';
let log = new Logger('API:auth', 'cyan');

export function getDevice(conn, dt) {
    return new Promise((resolve, reject) => {
        query(conn, 'SELECT * FROM `devices` WHERE `uuid` = "'+dt+'";').then(rows => {
            resolve((JSON.stringify(rows) === '[]')?null:rows[0]['user']);
        }).catch(err => reject(2));
    });
}

export function createDevice(conn) {
    return new Promise((resolve, reject) => {
        let did = uuid();
        query(conn, 'INSERT INTO `devices` (`uuid`, `user`) VALUES ("'+did+'", NULL);')
        .then(rows => resolve(did)).catch(err => reject(err));
    });
}

export function addDevice(conn, email, device) {
    return new Promise((resolve, reject) => {
        getDevice(conn, device).then(result => {
            /* // One account per device
            if (result !== null) {
                return reject(15);
            }
            */
            getUserByEmail(conn, email).then(user => {
                query(conn, 'UPDATE `devices` SET `user` = "'+user['uuid']+'" WHERE `uuid` = "'+device+'"')
                .then(result => resolve(0)).catch(err => reject(2));
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

export function emailInUse(conn, email) {
    return new Promise((resolve, reject) => {
        query(conn, 'SELECT * FROM `users` WHERE `email`="'+email+'"').then(rows => {
            let status = false;
            if (JSON.stringify(rows) !== '[]') status = true;
            resolve(status)
        }).catch(err => reject(2));
    });
}

export function getUser(conn, user) {
    return new Promise((resolve, reject) => {
        query(conn, 'SELECT * FROM `users` WHERE `uuid` = "'+user+'";').then(rows => {
            if (JSON.stringify(rows) === '[]') {
                // No account found using uuid
                reject(14)
            } else {
                resolve(rows[0]);
            }
        }).catch(err => reject(2));
    });
}

export function getUserByEmail(conn, email) {
    return new Promise((resolve, reject) => {
        query(conn, 'SELECT * FROM `users` WHERE `email` = "'+email+'";').then(rows => {
            if (JSON.stringify(rows) === '[]') {
                // No account found using email
                reject(11)
            } else {
                resolve(rows[0]);
            }
        }).catch(err => reject(2));
    });
}

export function getPassword(conn, user) {
    return new Promise((resolve, reject) => {
        getUser(conn, user).then(user => resolve(user['password'])).catch(err => reject(2));
    });
}

export function getTime() {
    let time = Math.floor((new Date).getTime()/10000)*10000;
    return [time, time-10000];
}

export function generatePD(password, device) {
    return sha1(password+device);
}

export function devicelessVerify(conn, token, email) {
    return new Promise((resolve, reject) => {
        let parts = token.split(':');
        getUserByEmail(conn, email).then(user => {
            let password = user['password'];
            let times = getTime();
            let pd = generatePD(password, parts[1]);
            if (sha1(pd, times[0]) === parts[0] || sha1(pd, times[1]) === parts[0]) {
                resolve(0);
            } else {
                reject(10);
            }
        }).catch(err => reject(err));
    });
}

export function verify(conn, token) {
    return new Promise((resolve, reject) => {
        let parts = token.split(':');
        getDevice(conn, parts[1]).then(user => {
            if (user === null) {
                return reject(9);
            }
            getPassword(conn, user).then(password => {
                let times = getTime();
                let pd = generatePD(password, parts[1]);
                if (sha1(pd, times[0]) === parts[0] || sha1(pd, times[1]) === parts[0]) {
                    resolve(0);
                } else {
                    reject(10);
                }
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

export function signin(conn, email, token) {
    return new Promise((resolve, reject) => {
        devicelessVerify(conn, token, email).then(result => {
            log.debug('Verified token without device');
            addDevice(conn, email, token.split(':')[1]).then(result => {
                resolve(0);
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}