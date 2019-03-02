//import * as c from 'chalk';
const c = require('chalk');
const colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];

export class Logger {
    private prefix: string;
    private color: string;

    constructor (prefix: string, color: string) {
        this.prefix = prefix;
        if (colors.includes(color)) {
            this.color = color;
        } else {
            this.color = 'white';
            this.warn('Attempted to use unknown color '+color+' when initalizing logger');
        }
    }

    public error = (msg: string) => {
        let prefix = c.bold.red('[')+c.bold[this.color](this.prefix)+c.bold.red('] ');
        console.error(prefix+c.bold[this.color](msg));
    };
    public warn = (msg: string) => {
        let prefix = c.bold.yellow('[')+c.bold[this.color](this.prefix)+c.bold.yellow('] ');
        console.warn(prefix+c.bold[this.color](msg));
    };
    public log = (msg: string) => {
        let prefix = c.white('[')+c[this.color](this.prefix)+c.white('] ');
        console.log(prefix+c[this.color](msg));
    };
    public debug = (msg: string) => {
        let prefix = c.grey('[')+c[this.color](this.prefix)+c.grey('] ');
        console.debug(prefix+c[this.color](msg));
    };
}

export const test = () => {
    for (let color of colors) {
        let log = new Logger('test', color);
        log.debug(color);
        log.log(color);
        log.warn(color);
        log.error(color);
    }
    return true;
}