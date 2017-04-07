  /*jslint node: true */
'use strict';
module.exports = function setup(options, imports, register) {
    const os = require('os');
    const logger = imports.logger;
    const controller = imports.coreBot.controller;
    const conf = imports.conf;
    const witbot = imports.witbot;
    let help = () => {};
    const fs = require('fs');
    const morningPhases = function(bot, convo) {
        fs.readFile(__dirname + '/morning.txt', 'UTF-8', function(err, contents) {
          try {
            if (err) throw err;
            let text = contents.toString();
            let lines = text.split('\n');
            let words = lines[Math.floor(Math.random() * lines.length)].toString();
            bot.replyWithTyping(convo, '<@' + convo.user + '> ' + words + convo.text);
            return;
            /*jshint -W002 */
          } catch (err) {
            bot.replyWithTyping(convo, "So sorry my master! :cry:");
          }
        });
    };

    controller.hears(['!version'], ',direct_mention,mention',
      function(bot, message) {
      bot.replyWithTyping(message, 'Running ' + conf.slack.version);
    });

    controller.hears(['call me (.*)', 'my name is (.*)'],
        'direct_message,direct_mention,mention', function(bot, message) {
        var name = message.match[1];
        controller.storage.users.get(message.user, function(err, user) {
            if (!user) {
                user = {
                    id: message.user,
                };
            }
            user.name = name;
            controller.storage.users.save(user, function(err, id) {
                bot.reply(message, 'Got it. I will call you *' + user.name +
                    '* from now on.');
            });
        });
    });

    controller.hears(['what is my name', 'who am i'],
        'direct_message,direct_mention,mention', function(bot, message) {
        controller.storage.users.get(message.user, function(err, user) {
            if (user && user.name) {
                bot.reply(message, 'Your name is ' + user.name);
            } else {
                bot.startConversation(message, function(err, convo) {
                    if (!err) {
                        convo.say('I do not know your name yet!');
                        convo.ask('What should I call you?',
                            function(response, convo) {
                            convo.ask('You want me to call you `' +
                                response.text + '`?', [
                                {
                                    pattern: 'yes',
                                    callback: function(response, convo) {
                                        convo.next();
                                    }
                                },
                                {
                                    pattern: 'no',
                                    callback: function(response, convo) {
                                        convo.stop();
                                    }
                                },
                                {
                                    default: true,
                                    callback: function(response, convo) {
                                        convo.repeat();
                                        convo.next();
                                    }
                                }
                            ]);

                            convo.next();

                        }, {'key': 'nickname'});

                        convo.on('end', function(convo) {
                            if (convo.status == 'completed') {
                                bot.reply(message, 'OK! I will update '+
                                    'my dossier...');

                                controller.storage.users.get(message.user,
                                    function(err, user) {
                                    if (!user) {
                                        user = {
                                            id: message.user,
                                        };
                                    }
                                    user.name = convo.extractResponse('nickname');
                                    controller.storage.users.save(user, function(err, id) {
                                        bot.reply(message, 'Got it. I will call you ' +
                                            user.name + ' from now on.');
                                    });
                                });
                            } else {
                                bot.reply(message, 'OK, nevermind!');
                            }
                        });
                    }
                });
            }
        });
    });

    controller.hears(['hi', 'hello', '[h-H]owdy.*', '[g-G]ood.*', '[m-M]orning.*'],
        'direct_message,direct_mention,ambient,mention', function(bot, message) {
        const wit = witbot.process(message.text, bot, message);
        wit.hears('how_are_you', 0.5, function(bot, message, outcome){
            controller.logger.log('debug', outcome);
            morningPhases(bot, message);
        });
    });

    controller.hears(['!uptime', 'identify yourself', 'who are you',
      'what is your name'], 'direct_message,direct_mention,ambient,mention',
        function(bot, message) {
            const wit = witbot.process(message.text, bot, message);
            wit.hears('how_are_you', 0.5, function(bot, message, outcome){
                bot.api.reactions.add({
                      timestamp: message.ts,
                      channel: message.channel,
                      name: 'robot_face',
                }, function(err, res) {
                      if (err) {
                        bot.botkit.log('Failed to add emoji reaction :(', err);
                      }
                });
                controller.storage.users.get(message.user, function(err, user) {
                    if (user && user.name) {
                        bot.replyWithTyping(message, 'Hello ' +
                            user.real_name + '!!');
                    } else {
                        bot.replyWithTyping(message, 'Hello.');
                    }
                });
                bot.startConversation(message, function(_, convo){
                    convo.ask('How are you?', function(response, convo){
                        witbot.process(response.text)
                            .hears('good', 0.5, function(outcome){
                                convo.say('I am so glad to hear it!');
                                convo.next();
                            })
                            .hears('bad', 0.5, function(outcome){
                                convo.say("I'm sorry, that is terrible");
                                convo.next();
                            })
                            .otherwise(function(outcome){
                                convo.say("I'm confused");
                                convo.repeat();
                                convo.next();
                            });
                    });
                });
            });
            var hostname = os.hostname();
            var uptime = formatUptime(process.uptime());
            bot.replyWithTyping(message, ':robot_face: I am a bot named <@' +
                bot.identity.name + '>. I have been running for `' +
                uptime + '` on `' + hostname + "`.");
    });

    function formatUptime(uptime) {
      var unit = 'second';
      if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
      }
      if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
      }
      if (uptime != 1) {
        unit = unit + 's';
      }

      uptime = Math.round(uptime) + ' ' + unit;
      return uptime;
    }

    controller.hears('!help', 'direct_message,direct_mention,ambient,mention', function(bot, message) {
        bot.replyWithTyping(message,"I'm glad you requesting help");
        var msg = "Could you please tell me your name or how "+
        "you want "+
        "me to call you?\n"+
        "_Ex:_\n"+
        "• My name is ${YOURNAME}.\n"+
        "• Call me ${YOURNAME}.\n" +
        "By the way, do you want ear Chuck Norris joke? try the next:\n"+
        "!chuck";
        bot.replyWithTyping(message, msg);
    });

    //register function, will be called by architecture.js in app.js
    register(null, {
        help
    });
};
