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

    public debug = (msg: string) => {
        let prefix = c.grey('[')+c[this.color](this.prefix)+c.grey('] ');
        console.debug(prefix+msg);
    };
    public error = (msg: string) => {
        let prefix = c.red.bold('[')+c[this.color](this.prefix)+c.red.bold('] ');
        console.error(prefix+msg);
    };
    public warn = (msg: string) => {
        let prefix = c.orange.bold('[')+c[this.color](this.prefix)+c.orange.bold('] ');
        console.warn(prefix+msg);
    };
    public log = (msg: string) => {
        let prefix = c.white('[')+c[this.color](this.prefix)+c.white('] ');
        console.log(prefix+msg);
    };
}
