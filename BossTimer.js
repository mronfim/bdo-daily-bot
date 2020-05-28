const assert = require("assert");
const { Scheduler } = require("./Scheduler.js");
const data = require("./boss.json");
const utils = require("./utils.js");

const MS_TIMEOUT = 30000;

class BossTimer extends Scheduler {

    constructor(callback) {
        super(MS_TIMEOUT);
        
        assert(typeof callback == "function");
        this.callback = callback;
        
        // Will hold a reference to the last timeslot (the first created)
        // in order to be used after the loop
        let last;

        // Iterate backwards through the data.timeslots array
        // and initialize a linked list of TimeSlots
        for (let i=data.timeslots.length-1; i>=0; i--) {
            let temp = new TimeSlot(data.timeslots[i]);
            temp.setNext(this.currTimeSlot);
            this.currTimeSlot = temp;

            // Save a reference to the last timeslot in the list
            if (i === data.timeslots.length-1) {
                last = temp;
            }
        }

        // Point last.next to the first timeslot in order to make the
        // list circular
        last.setNext(this.currTimeSlot);

        this.setCurrentTime();
        this.day = this.getWeekDay();

        // Set the correct current time slot
        while (this.getHourMinutesMS() > this.currTimeSlot.valueOf()) {
            this.currTimeSlot = this.currTimeSlot.next;
        }
    }

    run() {
        // update current time
        this.setCurrentTime();

        // get the next boss information
        let bosses = [];
        this.getNextBossID().forEach(id => {
            bosses.push(data.info[id]);
        });

        // call callback function
        this.callback(bosses);
    }

    /**
     * Updates the currTimeSlot to the next timeslot that has a boss spawning.
     * Returns the ID of the next boss that is spawning
     * 
     * @returns Number - the ID of the next boss
     */
    getNextBossID() {

        if (this.getHourMinutesMS() > this.currTimeSlot.valueOf() || 
            data.spawnTimes[this.currTimeSlot.label][this.day].length == 0) {
            // Update currTimeSlot to point to the next TimeSlot
            this.currTimeSlot = this.currTimeSlot.getNext();
            // Check whether we need to update the day of the week.
            if (this.currTimeSlot.hour == 0) {
                this.day += 1;
            }
            // Check for overflow
            if (this.day > 6) {
                this.day = 0;
            }

            // Check that there is a boss that spawns at this time
            while (data.spawnTimes[this.currTimeSlot.label][this.day].length == 0) {
                // If the timeslot has no boss, set it to the next
                this.currTimeSlot = this.currTimeSlot.getNext();
                // Check whether we need to update the day of the week.
                if (this.currTimeSlot.hour == 0) {
                    this.day += 1;
                }
                // Check for overflow
                if (this.day > 6) {
                    this.day = 0;
                }
            }
        }

        utils.log(`TimeSlot: ${this.currTimeSlot.label}`)
        utils.log(`Day: ${this.day}`)

        return data.spawnTimes[this.currTimeSlot.label][this.day];
    }

    setCurrentTime() {
        let local_time = new Date();
        this.currentTime = new Date(local_time.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    }

    getWeekDay() {
        let day = this.currentTime.getDay() - 1;
        if (day < 0) day = 6;
        return day;
    }

    getHourMinutesMS() {
        let hours = this.currentTime.getHours();
        let minutes = this.currentTime.getMinutes();
        return (hours * 60 + minutes) * 60 * 1000;
    }

}

class TimeSlot {

    constructor(timeString) {
        this.label = timeString;
        this.hour = parseInt(timeString.split(":")[0]);
        this.minute = parseInt(timeString.split(":")[1]);
    }

    getNext() {
        return this.next;
    }

    setNext(next) {
        this.next = next;
    }

    valueOf() {
        return (this.hour * 60 + this.minute) * 60 * 1000;
    }

    compare(timeSlot) {
        if (this.valueOf < timeSlot.valueOf) return -1;
        if (this.valueOf > timeSlot.valueOf) return 1;
        return 0;
    }

}


module.exports = {
    BossTimer,
};