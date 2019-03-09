import * as express from 'express';
import { Logger } from './util/logger';
let log = new Logger('API', 'cyan');

export function startServer(conn?, port = 8080) {
    const app = express();

    app.get( "/", ( req, res ) => {
        res.send( "Hello world!" );
    } );
    
    app.listen( port, () => {
        log.log( `server started at http://127.0.0.1:${ port }` );
    } );
}

export function test(sm) {
    try {
        startServer();
    } catch(err) {
        return false;
    }
    return true;
}