/*jslint node: true */
'use strict';
module.exports = function setup(options, imports, register) {
    const winston = require('winston');
    const fs = require('fs');
    const env = imports.conf.environment || 'development';
    const logsPath = imports.conf.logger.path;
    const logDir = logsPath;


    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    const tsFormat = () => (new Date()).toLocaleTimeString();
    const logger = new (winston.Logger)({
      transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
          timestamp: tsFormat,
          colorize: true,
          level: 'info'
        }),
        new (require('winston-daily-rotate-file'))({
          filename: `${logDir}/-results.log`,
          timestamp: tsFormat,
          datePattern: 'yyyy-MM-dd',
          prepend: true,
          level: env === 'development' ? 'debug' : 'info'
        })
      ]
    });
    
    //register function, will be called by architecture.js in app.js
    register(null, {
        logger
    });
};