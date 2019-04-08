import * as uuid from 'uuidv4';
import { query } from './database';

export function getDevice(conn, dt) {
    return new Promise((resolve, reject) => {
        query(conn, 'SELECT * FROM `devices` WHERE `uuid` = "'+dt+'";').then(rows => {
            resolve((JSON.stringify(rows) === '[]')?9:0);
        }).catch(err => reject(err));
    })
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