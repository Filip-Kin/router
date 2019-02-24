import { Logger } from './logger';
const log = new Logger('Timing', 'magenta');

export function requestTime(startTime, msg) {
    let now = new Date();
    let time = 0;
    if (typeof startTime === 'number') {
        time = now.getTime() - startTime;
    } else {
        time = now.getTime() - startTime.getTime();
    }
    if (time > 200) {
        log.warn(msg+': '+time+'ms');
    } else {
        log.log(msg+': '+time+'ms');
    }
    return time;
}
