/*jslint node: true */
'use strict';
module.exports = function setup(options, imports, register) {
    const Botkit = require('botkit');

    const conf = imports.conf;
    const logger = imports.logger;
    const storageType = conf.storage.type;
    let storage = 'simple_storage';
    const os = require('os');
    let redisConfig;

    if (storageType !== "undefined"){
        // By default we use sqlite as storage
        if (storageType === 'sqlite'){
            storage = imports.storage;
        }
        if (storageType === "redis"){
            logger.info('Running with env.REDIS_PORT %s',  process.env.REDIS_PORT);
            logger.info('Running with env.REDIS_HOSTNAME %s', process.env.REDIS_HOSTNAME);
            let hostname = process.env.REDIS_HOSTNAME || '127.0.0.1';
            let port = process.env.REDIS_PORT || '6379';
            let url = 'redis://'+ hostname + ':' + port;
            logger.info('URL: %s', url);
            redisConfig = {
                url: url,
                namespace: process.env.REDIS_DB_NAME || 'tapatio',
                methods: ['bots', 'groups', 'team', 'subgroups'],
            };
            storage = require('botkit-storage-redis')(redisConfig);
        }
        else {
            storage = require("../" + conf.storageType.path);
        }
    }
    logger.info('Using storage: %s', storageType);
    logger.info(redisConfig);
    let controller = Botkit.slackbot({
        logger: logger,
        storage:  storage,
        stale_connection_timeout: 7200,
        require_delivery: true
    });

    let bot = null;
    function start(){
        bot = controller.spawn({
            token: conf.slack.token,
            no_unreads: false
        }).startRTM(function(err, bot, payload){
            logger.info("Team Identity: %s", payload.team.name);
            logger.info("Bot Identity: %s", bot.identity.name);
            if(storageType === "redis"){
                logger.info('Starting to save Users info to redis db');
                let async = require('async');
                let users = payload.users;
                let channels = payload.channels;
                let bots = payload.bots;
                let groups = payload.groups;

                async.parallel(
                    {
                        users: function(cb){
                            cb(null, users);
                            },
                        channels: function(cb){
                            cb(null, channels);
                            },
                        bots: function(cb){
                            cb(null, bots);
                        },
                        groups: function(cb){
                            cb(null, groups);
                        },
                    }, function(err, results){
                        if(err){
                            logger.info('Error: %s',err);
                        }
                        async.mapValues(results, function(lists, kind, callback){
                            async.map(lists, function(item){
                                controller.storage[kind].save(item, function(err, result){
                                    if(err){
                                        logger.info('Error: %s', kind);
                                        logger.info('Error: %s',item);
                                        logger.info('Error: %s',err);
                                    }
                                });
                            }, function(err, result){
                                if(err){
                                    logger.info('Error: %s',err);
                                }
                                logger.info('Finished to save Users info to redis db');
                        });
                    });
                });
            }
        });
    }
    start();

    bot.utterances.email = new RegExp(/<mailto:([\w?\.?\_?\-?\w]*@.*)\|.*/i);
    bot.utterances.cancel = new RegExp(/^cancel/i);
    controller.on('rtm_close', function() {
        process.exit(1);
        start();
    });

    const coreBot = {
        bot: bot,
        controller: controller
    };
    //register function, will be called by architecture.js in app.js
    register(null, {
        coreBot
    });
};
