const path = require('path');
const architect = require("architect");
const configPath = path.join(__dirname, "app_config.js");
const config = architect.loadConfig(configPath);

var app = architect.createApp(config, function (err, app) {
    if (err) {
        console.trace("Error while starting '%s':", config);
        console.log(err, err.stack);
        process.exit(1);
    }
});

app.on("service", function(name, plugin) {
    if (typeof plugin !== "function"){
        plugin.name = name;
    }
});
