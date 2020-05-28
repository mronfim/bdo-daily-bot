const printf = require("printf");
const assert = require("assert");
const data = require("./boss.json");
const utils = require("./utils.js");

class Spawner {

    constructor() {

        let m = data.spawnTimes.length;
        let n = data.spawnTimes[0].bosses.length;

        this.list = new Array(m * n);

        for (let i = 0; i < data.spawnTimes.length; i++) {
            for (let day = 0; day < data.spawnTimes[i].bosses.length; day++) {
                
                let temp = new SpawnTime(i, day);
                this.list[day * n + i] = temp; // Effectively transposes the spawnTime matrix
            }
        }

        console.log(this.list);

        this.current = 0;

    }

    viewTable() {
        let charsPerCell = 20;
        
        let index = 0;
        while (index < this.list.length) {
            let node = this.list[index];
            let name = node.bosses.join(", ");

            if (node.time_label === "00:00") {
                printf("\t%d |", node.day);
            }
            printf("%s%s", " ".repeat(charsPerCell - name.length), name);
            if (node.time_label === "22:15") {
                printf(" |\n");
            }

            index++
        };
    }

}

class SpawnTime {

    constructor(timeslot, day) {
        this.day = day;
        this.bosses = data.spawnTimes[timeslot].bosses[day];
        this.time_label = data.spawnTimes[timeslot].time;
        this.hour = parseInt(this.time_label.split(":")[0]);
        this.minute = parseInt(this.time_label.split(":")[0]);
        this.time = ((day * 24 + this.hour) * 60 + this.minute) * 60 * 1000;
    }
}

module.exports = {
    Spawner,
};