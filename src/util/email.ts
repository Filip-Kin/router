import * as nodemailer from 'nodemailer';
import { Logger } from '../util/logger';
let log = new Logger('Email', 'blue');

export function sendMail(email, conf) {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: conf.email.address,
                pass: conf.email.password
            }
        });

        email['from'] = conf.email.sender
        
        transporter.sendMail(email, (err, info) => {
            if (err) {
                log.warn(err.message);
                reject((err.message.includes('login'))?7:6);
            } else {
                log.debug('Sent email to '+email.to+': '+info.response);
                resolve(0);
            }
        });
    });
}

/*
export async function test(sm) {
    try {
        await sendMail({to: 'filip@kinmails.com', subject: 'test', html: '<h1>Hello, World!</h1>'});
    } catch (err) {
        console.log(err);
        return false;
    }
    return true;
}
*/