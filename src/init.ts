//import { Logger } from './util/logger'; // This won't work because System is not defined?
let { Logger } = require('./util/logger');

const log = new Logger('Init', 'white');

log.log('Initializing Kiwahosting Router/API');
log.log('LMAO it doesn\'t do anything yet');