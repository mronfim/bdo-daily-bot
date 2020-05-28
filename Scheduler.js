const utils = require("./utils.js");

class Scheduler {

    constructor(timeout) {
        this.timeout = timeout;
        this.running = false;
    }

    start() {
        if (this.running) {
            utils.log("Scheduler already running.", { logLevel: "warning" });
            return;
        }

        utils.log("Starting Scheduler.");

        this.running = true;
        this.hInterval = setInterval(this.run.bind(this), this.timeout);
        // this.run();
    }

    stop() {
        if (!this.running) {
            utils.log("Scheduler already stopped.", { logLevel: "warning" });
        }

        utils.log("Stopping Scheduler.");

        this.running = false;
        clearInterval(this.hInterval);
    }

    run() {
        utils.log("Scheduler run() method not implemented.", { logLevel: "warning" });
    }

}

module.exports = {
    Scheduler,
};