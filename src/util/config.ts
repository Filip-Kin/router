import { existsSync, readFileSync, writeFile } from 'fs';
import { Logger } from './logger';
const log = new Logger('Config', 'yellow');

export function load() {
    const defaultConfig = {
        config_version: 1,
        database: {
            user: 'hosting',
            password: 'i5@8$XkplQNY9irDD^OxXt@toaEzI2Qs',
            host: '127.0.0.1',
            database: 'hosting'
        },
        caching: {}
    };
    
    let json = {};
    
    // If file doesn't exist, make it exist
    if (!existsSync('./config.json')) {
        writeFile('./config.json', JSON.stringify(defaultConfig, null, 2), (err) => {
            if (err) { 
                log.error(err.message)
            } else {
                log.log('Wrote default config')
            }
        });
        json = defaultConfig;
    } else {
        try {
            json = JSON.parse(readFileSync('./config.json').toString());
        } catch(err) {
            log.error(err.message);
        }
    }
    
    log.debug(JSON.stringify(json));

    // If software updateted and things have been added to config
    // Make a new config file and tell user to fix
    if (defaultConfig.config_version > json['config_version']) {
        log.warn('See updated config in config.json.new, many issues will occur until config is updated');
        log.error('The software will not be supported until the config is up to date');
        writeFile('./config.json.new', JSON.stringify(defaultConfig, null, 2), (err) => {
            if (err) { 
                log.error(err.message)
            } else {
                log.log('Created updated config')
            }
        });
    }
    
    const database: { [s: string]: string } = json['database'];
    const caching: { [s: string]: number } = json['caching']; 

    return {
        database: database, 
        caching: caching
    };
}
