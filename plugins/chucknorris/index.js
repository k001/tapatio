/*jslint node: true */
'use strict';
module.exports = function setup(options, imports, register) {
    const controller = imports.coreBot.controller;

    let util = require('util');
    let path = require('path');
    let fs = require('fs');
    let SQLite = require('sqlite3').verbose();

    var config = options.chuckPathDb;
    if(!config){
        config = {
            chuckdbPath: './storage'
        };
    }
    var db;
    var _connectDb = function() {
        var dbPath = path.resolve(config.chuckdbPath, 'chucknorris.db');
        if (!fs.existsSync(dbPath)) {
            console.error('Database path ' + '"' + dbPath + '" does not exists or it\'s not readable.');
            process.exit(1);
        }
        db = new SQLite.Database(dbPath);
    };
    _connectDb();
    function firstRunCheck(bot, message){
        db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
            if (err) {
                return console.error('DATABASE ERROR:', err);
            }

            var currentTime = (new Date()).toJSON();

            // this is a first run
            if (!record) {
                welcomeMessage(bot, message);
                return db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
            }

            // updates with new last running time
            db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
        });
    }
    function welcomeMessage(bot, message) {
        bot.replyWithTyping(message,'Hi guys, roundhouse-kick anyone?' +
            '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `!joke` to invoke me!');
    }
    function ramdomJoke(bot, message){
        db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
            if (err) {
                return console.error('DATABASE ERROR:', err);
            }
            bot.replyWithTyping(message, record.joke);
            db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
        });
    }

    controller.hears(['Chuck Norris', '!chuck', '!joke'],'direct_message,direct_mention,ambient,mention',
      function(bot, message) {
        firstRunCheck(bot, message);
        ramdomJoke(bot, message);
    });

    let chuck = ()=>{};

    //register function, will be called by architecture.js in app.js
    register(null, {
        chuck
    });
};
