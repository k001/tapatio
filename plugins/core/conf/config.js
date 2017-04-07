/*jslint node: true */
'use strict';
module.exports = function setup(options, imports, register) {
    const path = require('path');
    const fs = require('fs');
    const yaml = require('js-yaml');

    const configFile = 'config.yaml';
    function get_conf(){
        try {
            const filename = path.join(__dirname, configFile);
            const contents = fs.readFileSync(filename, 'utf-8');
            const data = yaml.safeLoad(contents);
            return data;
        }
        catch(err){
            console.log(err.stack || String(err));
        }
    }
    const conf = get_conf();
    
    //register function, will be called by architecture.js in app.js
    register(null, {
        conf
    });
};