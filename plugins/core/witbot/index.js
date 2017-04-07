/*jslint node: true */
/*jshint multistr: true */
'use strict';
module.exports = function setup(options, imports, register) {
    const Witbot = require('witbot');
    const conf = imports.conf;
    const witbot = Witbot(conf.wit.token);
    
    //register function, will be called by architecture.js in app.js
    register(null, {
        witbot
    });
};