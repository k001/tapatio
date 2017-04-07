/*jslint node: true */
'use strict';
module.exports = function setup(options, imports, register) {
  const fs = require('fs');
  const sorryPhases = function(convo) {
    fs.readFile(__dirname + '/dictionary.txt', 'UTF-8', function(err, contents) {
      try {
        if (err) throw err;
        var text = contents.toString();
        var lines = text.split('\n');
        var words = lines[Math.floor(Math.random() * lines.length)].toString();
        convo.say(words);
        return;
        /*jshint -W002 */
      } catch (err) {
        convo.say("So sorry my master! :cry:");
      }
    });
  };

    register(null, {
        sorryPhases
    });

};