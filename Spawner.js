const printf = require("printf");
const assert = require("assert");
const data = require("./data/boss.json");
const utils = require("./utils.js");

const timezoneJS = require("timezone-js");
const tzdata = require("tzdata");
var _tz = timezoneJS.timezone;
_tz.loadingScheme = _tz.loadingSchemes.MANUAL_LOAD;
_tz.loadZoneDataFromObject(tzdata);

class Spawner {

    constructor() {

        let m = data.spawnTimes.length;
        let n = data.spawnTimes[0].bosses.length;

        this.list = new Array(m * n);

        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                
                let temp = new SpawnTime(i, j);
                this.list[j * m + i] = temp; // Effectively transposes the spawnTime matrix
            }
        }

        this.current = 0;
    }

    shouldGetNext(date, i) {
        let spawn = this.list[i];
        let day = getWeekDay(date);
        let hour = date.getHours();
        let minute = date.getMinutes();

        // check day
        if (day < spawn.day)
            return false;
        else if (day > spawn.day)
            return true;
        
        // check hour
        if (hour < spawn.hour)
            return false;
        else if (hour > spawn.hour)
            return true;
        
        // check minute
        if (minute > spawn.minute)
            return true;
        
        // check for no spawns
        if (spawn.bosses.length < 1)
            return true;

        return false;
    }

    getNext() {
        utils.log("GETTING NEXT BOSS...");

        let date = this.getCurrentDate();
        
        while (this.shouldGetNext(date, this.current)) {
            this.current = (this.current + 1) % this.list.length;
        }

        utils.log(this.list[this.current]);

        // calculate time left until next boss
        let boss = this.list[this.current];
        let bossDate = getPreviousMonday(date);
        bossDate.setDate(bossDate.getDate() + boss.day);
        bossDate.setHours(boss.hour);
        bossDate.setMinutes(boss.minute);
        bossDate.setSeconds(0);

        let next = {
            id: this.current,
            bosses: this.list[this.current],
            date: new timezoneJS.Date(bossDate.valueOf(), 'America/New_York'),
            eta: bossDate - date,
        };

        utils.log(next);

        return next;
    }

    getCurrentDate() {
        let local_time = new Date();
        return new timezoneJS.Date(local_time, 'America/Los_Angeles');
    }

    viewTable() {
        let charsPerCell = 20;
        
        let index = 0;
        while (index < this.list.length) {
            let node = this.list[index];
            let name = node.bosses.map(boss => boss.name).join(", ");

            if (node.time_label === "00:00") {
                process.stdout.write(`\t${node.day} |`);
            };

            process.stdout.write(`${" ".repeat(charsPerCell - name.length)}${name}`);
            
            if (node.time_label === "22:15") {
                console.log(" |");
            }

            index++;
        };
    }

}

class SpawnTime {

    constructor(timeslot, day) {
        this.day = day;
        this.bosses = data.spawnTimes[timeslot].bosses[day].map(id => data.info[id]);
        this.time_label = data.spawnTimes[timeslot].time;
        this.hour = parseInt(this.time_label.split(":")[0]);
        this.minute = parseInt(this.time_label.split(":")[1]);
        this.time = ((day * 24 + this.hour) * 60 + this.minute) * 60 * 1000;
    }
}

module.exports = {
    Spawner,
};



function getPreviousMonday(date) {
    let prevMonday = new timezoneJS.Date(date.valueOf(), 'America/Los_Angeles');
    prevMonday.setDate(prevMonday.getDate() - ((prevMonday.getDay() + 6) % 7));
    prevMonday.setHours(0, 0, 0, 0);
    prevMonday.setMinutes(0, 0, 0);
    prevMonday.setSeconds(0, 0);
    return prevMonday;
}

function getWeekDay(date) {
    let day = date.getDay() - 1;
    if (day < 0) day = 6;
    return day;
}

function getMSinWeek(date) {
    return date.valueOf() - getPreviousMonday(date).valueOf();
}

function getHourMinutesMS(time) {
    let hours = time.getHours();
    let minutes = time.getMinutes();
    return (hours * 60 + minutes) * 60 * 1000;
}