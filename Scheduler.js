const utils = require("./utils.js");

class Scheduler {

    constructor(timeout, func) {
        this.timeout = timeout;
        this.running = false;
        this.func = func;
    }

    start() {
        if (this.running) {
            utils.log("Scheduler already running.", { logLevel: "warning" });
            return;
        }

        utils.log("Starting Scheduler.");

        this.running = true;
        this.run();
        this.hInterval = setInterval(this.run.bind(this), this.timeout);
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
        if (!this.func || typeof this.func !== "function") {
            utils.log("Scheduler has no callback.", { logLevel: "warning" });
            this.stop();
        } else {
            this.func();
        }
    }

}

module.exports = {
    Scheduler,
};