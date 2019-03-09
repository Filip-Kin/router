import * as cla from 'command-line-args';
const args = cla([{name: 'module', alias: 'm', type: String},{name: 'submodule', alias: 's', type: Number, default: 0}]);

let modules = {};
let results = {};
const load = {
    'config': './util/config',
    'logger': './util/logger',
    'timer': './util/timer',
    'api': './api',
    'router': './router'
};

for (let testModule in load) {
    if (args.module === testModule || args.module === 'all') {
        try {
            console.log('\nTesting '+testModule);
            modules[testModule] = require(load[testModule]);
            results[testModule] = modules[testModule].test(args.submodule);
        } catch(err) {
            console.error(err.message);
            results[testModule] = null;
        }
    }
}

console.log(results);