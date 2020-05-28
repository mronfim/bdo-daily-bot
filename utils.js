const assert = require("assert");

const logLevels = {
    info: "INFO",
    warning: "WARNING",
    error: "ERROR",
    debug: "DEBUG",
};

module.exports.log = function(message, config={}) {
    assert(message);
    assert(typeof config == "object" || typeof config == "undefined");

    let logLevel = "info";
    if (config && config.logLevel) logLevel = config.logLevel;

    let date = new Date();
    
    if (typeof message == "string") {
        console.log(`[${date.toLocaleString()}]\t[${logLevels[logLevel]}] ${message}`);
    } else {
        console.log(`[${date.toLocaleString()}]\t[${logLevels[logLevel]}]`);
        console.log(message);
    }
}