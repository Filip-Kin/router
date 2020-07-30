import * as uuid from 'uuidv4';
import * as sha1 from 'sha1';
import { query } from './database';

export function getDevice(conn, dt) {
    return new Promise((resolve, reject) => {
        query(conn, 'SELECT * FROM `devices` WHERE `uuid` = "'+dt+'";').then(rows => {
            resolve((JSON.stringify(rows) === '[]')?null:rows[0]['user']);
        }).catch(err => reject(err));
    });
}

export function createDevice(conn) {
    return new Promise((resolve, reject) => {
        let did = uuid();
        query(conn, 'INSERT INTO `devices` (`uuid`, `user`) VALUES ("'+did+'", NULL);').then(rows => {
            resolve(did);
        }).catch(err => reject(err));
    });
}

export function emailInUse(conn, email) {
    return new Promise((resolve, reject) => {
        query(conn, 'SELECT * FROM `users` WHERE `email`="'+email+'"').then(rows => {
            let status = false;
            if (JSON.stringify(rows) !== '[]') status = true;
            resolve(status)
        }).catch(err => {
            reject(err)
        });
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
        }).catch(err => reject(2))
    });
}

export function getPassword(conn, user) {
    return new Promise((resolve, reject) => {
        getUser(conn, user).then(user => resolve(user['password'])).catch(err => reject(err));
    });
}

export function getTime() {
    let time = Math.floor((new Date).getTime()/10000)*10000;
    return [time, time-10000];
}

export function generatePD(password, device) {
    return sha1(password+device);
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
            });
        }).catch(err => reject(err))
    });
}