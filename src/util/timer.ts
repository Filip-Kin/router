import { Logger } from "./logger";
const log = new Logger('Timer', 'yellow');

export const timer = (startTime, msg) => {
    let now = new Date();
    startTime = startTime.getTime();
    let time = 0;
    if (typeof startTime === 'number') {
        time = now.getTime() - startTime;
    } else {
        time = now.getTime() - startTime.getTime();
    }
    if (time > 200) {
        log.warn(msg+': '+time+'ms');
    } else {
        log.debug(msg+': '+time+'ms');
    }
    return time;
}

export const test = () => {
    let start = new Date();
    let msg = 'Test'
    setTimeout(() => timer(start, msg), 100);
    setTimeout(() => timer(start, msg), 500);
    return true;
}
