var Discord = require('discord.js');
var dateFormat = require('dateFormat');
var auth = require('./auth.json');
const { BossTimer } = require("./BossTimer.js");

const bosses = require('./boss.json');
const months = require('./months.json');

const PLAYERS_CLUB_ID = "412273579330240532";
const BDO_CHANNEL_ID = "707670014316249141";
const BDO_MSG_CHANNEL_ID = "707670180138057828";

const CHANNEL_PREFIX = "[";
const BDO_BOSS_UPDATE = "BDOBossUpdate";

var client = new Discord.Client();

client.on('ready', () => {
    const guild = client.guilds.cache.get(PLAYERS_CLUB_ID);
    const parent = guild.channels.cache.get(BDO_CHANNEL_ID);

    let channel_name = getNewName();

    let channel = guild.channels.cache.find(channel => channel.name.startsWith(CHANNEL_PREFIX) && channel.parentID === BDO_CHANNEL_ID);
    if (!channel) {
        let channelOptions = {
            type: "voice",
            parent: parent,
            position: 1,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [ 'SPEAK', 'CONNECT', 'CREATE_INSTANT_INVITE' ],
                },
            ]
        };
        guild.channels.create(channel_name, channelOptions).then(new_channel => {
            channel = new_channel;
            bossCountdown();
        });
    } else {
        bossCountdown();
    }

    function bossCountdown() {
        const interval = setInterval(() => {
            channel_name = getNewName();
            channel.setName(channel_name)
                .catch(err => console.log(err));
        }, 30000);
    }

    function getNewName() {
        let boss_timer = new BDOBossTimer();
        let next_boss = boss_timer.getNext();
    
        if (this.last_boss_id != next_boss.id) {
            client.emit(BDO_BOSS_UPDATE, { message: next_boss });
            this.last_boss_id = next_boss.id;
        }
    
        return CHANNEL_PREFIX + next_boss.time + "] " + next_boss.name;
    }
});

client.on(BDO_BOSS_UPDATE, (data) => {
    console.log('New Boss:', data.message);

    let boss = data.message.name.split("/");

    if (boss.length == 1) {
        let timeURL = `https://time.is/compare/${pad2(data.message.date.getHours())}${pad2(data.message.date.getMinutes())}_${data.message.date.getDate()}_${months[data.message.date.getMonth()+1]}_${data.message.date.getFullYear()}_in_EDT`;
        const embed_msg = new Discord.MessageEmbed()
            .setColor('#ff0000')
            .setTitle("Next World Boss")
            .setURL("https://mmotimer.com/bdo/?server=na")
            .setAuthor("BDO Daily", "https://cdn.discordapp.com/app-icons/712781321180545114/d3d5fef8113ef8758e4f7d2a091a5e75.png?size=256", "http://www.bdodaily.com/")
            .setDescription(`${data.message.name} will be spawning at [${dateFormat(data.message.date, "longTime")}](${timeURL})`)
            .setThumbnail(bosses[boss[0]].icon)
            .setImage(bosses[boss[0]].map)
            .setTimestamp();
        
        client.channels.cache.get(BDO_MSG_CHANNEL_ID).send(embed_msg);
    }
});

client.login(auth.token);

class BDOBossTimer {
    constructor() {
        this.spawn_times = [
            hoursMinToMilli(0, 0),
            hoursMinToMilli(3, 0),
            hoursMinToMilli(7, 0),
            hoursMinToMilli(10, 0),
            hoursMinToMilli(14, 0),
            hoursMinToMilli(17, 0),
            hoursMinToMilli(20, 15),
            hoursMinToMilli(21, 15),
            hoursMinToMilli(22, 15),
        ];
        this.bosses = [
            // Monday, Tuesday .... Sunday
            ["Karanda", "Kutum", "Karanda", "Kutum", "Nouver", "Offin", "Kzarka"],
            ["Kzarka", "Kzarka", null, "Kzarka", "Karanda", "Nouver", "Kutum"],
            ["Kzarka", "Nouver", "Karanda", "Kutum", "Kutum", "Kutum", "Nouver"],
            ["Offin", "Kutum", "Nouver", "Nouver", "Karanda", "Nouver", "Kzarka"],
            ["Kutum", "Nouver", "Kutum", "Kzarka", "Nouver", "Quint/Muraka", "Vell"],
            ["Nouver", "Karanda", "Offin", "Kutum", "Kzarka", "Karanda/Kzarka", "Garmoth"],
            ["Kzarka", "Garmoth", "Karanda/Kzarka", "Garmoth", "Kzarka/Kutum", "Conquest Wars", "Kzarka/Nouver"],
            [null, null, "Quint/Muraka", null, null, null, null],
            ["Karanda", "Kutum/Kzarka", "Nouver", "Kzarka/Karanda", "Karanda", "Kutum/Nouver", "Karanda/Kutum"],
        ]
    }

    getNext() {
        let local_time = new Date();
        let pst_time = new Date(local_time.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));

        let weekday_index = pst_time.getDay() - 1;
        if (weekday_index < 0) {
            weekday_index = 6;
        }

        let offset = hoursMinToMilli(pst_time.getHours(), pst_time.getMinutes(), pst_time.getSeconds());

        let next_index = -1;
        for (let i = 0; i < this.spawn_times.length; ++i) {
            let a = this.spawn_times[i];
            // [BUG] doesnt consider the eadge case in which the last time slot
            // and the first time slot of the next day is null.
            if (offset <= a && this.bosses[i][weekday_index]) {
                next_index = i;
                break;
            }
        }

        if (next_index === -1) {
            next_index = 0;
        }

        let ms_left = this.spawn_times[next_index] - offset;
        if (next_index === 0) {
            ms_left = hoursMinToMilli(24) - offset;
        }
        let hours_left = Math.floor(ms_left / (1000 * 60 * 60));
        let minutes_left = Math.floor((ms_left / (1000 * 60)) % 60);
        
        let boss_name = this.bosses[next_index][weekday_index];
        let countdown = `${pad2(hours_left)}:${pad2(minutes_left)}`;

        console.log(`Next Boss: ${boss_name}, [${next_index}][${weekday_index}]`);
        console.log(`Time: [${countdown}]`);

        return { id: next_index*10 + weekday_index, name: boss_name, time: countdown, date: new Date(local_time.valueOf() + ms_left) };
    }

    getPreviousMonday(date) {
        let prevMonday = new Date(date.valueOf());
        prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7);
        prevMonday.setHours(0);
        prevMonday.setMinutes(0);
        prevMonday.setSeconds(0);
        return prevMonday;
    }
}

function hoursMinToMilli(hours=0, minutes=0, seconds=0) {
    return ((hours * 60  + minutes) * 60 + seconds) * 1000;
}

function pad2(number) {
    return (number < 10 ? '0' : '') + number
}