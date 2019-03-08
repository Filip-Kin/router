import { existsSync, readFileSync, writeFile, unlinkSync } from 'fs';
import { Logger } from './logger';
const log = new Logger('Config', 'yellow');

const globalDefaultConfig = {
    config_version: 1,
    database: {
        user: 'hosting',
        password: 'i5@8$XkplQNY9irDD^OxXt@toaEzI2Qs',
        host: '127.0.0.1',
        database: 'hosting'
    },
    caching: {}
};

export function load(defaultConfig: any=globalDefaultConfig, file='config.json') {  
    let json = defaultConfig;
    
    // If file doesn't exist, make it exist
    if (!existsSync(file)) {
        writeFile(file, JSON.stringify(defaultConfig, null, 2), (err) => {
            if (err) { 
                log.error(err.message);
                log.warn('The application will continue running assuming default config for ');
            } else {
                log.log('Wrote default config for '+file);
            }
        });
    } else {
        try {
            json = JSON.parse(readFileSync(file).toString());
        } catch(err) {
            log.error(err.message);
            log.warn('The application will continue running assuming default config');
        }
    }
    
    log.debug(JSON.stringify(json));

    // If software updateted and things have been added to config
    // Make a new config file and tell user to fix
    if (defaultConfig.config_version > json['config_version']) {
        log.warn('See updated config in '+file+'.new, any new variables will be assumed to be default');
        log.warn('To remove this message change the config_version to '+defaultConfig.config_version+' in '+file)
        writeFile(file+'.new', JSON.stringify(defaultConfig, null, 2), (err) => {
            if (err) { 
                log.error(err.message)
            } else {
                log.log('Created updated config')
            }
        });
    }
    
    // Add specific typescript magic if its the main config
    if (file === 'config.json') {
        const database: { [s: string]: string } = json['database'];
        const caching: { [s: string]: number } = json['caching']; 
    
        return {
            database: database, 
            caching: caching
        };
    } else {
        return json;
    }
}

export const destroy = (file) => {
    try {
        unlinkSync(file);
    } catch (err) {
        log.error(err.message);
        return false;
    }
    log.log('Deleted config '+file);
    return true;
}

export const test = (sm) => {
    log.debug('Loading main config');
    load({config_version: 1});
    log.debug('Loading test config');
    load({config_version: 1}, 'test.json');
    log.debug('Deleting test config');
    return destroy('test.json');
};