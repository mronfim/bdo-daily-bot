const Discord = require('discord.js');
const dateFormat = require('dateFormat');

const { Spawner } = require("./Spawner.js");
const { Scheduler } = require("./Scheduler.js");
const utils = require("./utils.js");
const months = require('./data/months.json');

const BDO_BOSS_UPDATE = "BDOBossUpdate";
const VOICE_ALERT = "VoiceAlert";
const TIMEOUT_MS = 30000;

var client = new Discord.Client();
client.on('ready', () => {
    const guild = client.guilds.cache.get(process.env.DISCORD_PLAYERS_CLUB_ID);
    const parent = guild.channels.cache.get(process.env.DISCORD_BDO_CHANNEL_ID);

    const spawner = new Spawner();

    let channelName = getNewName();
    var channel = guild.channels.cache.find(channel => channel.name.startsWith("[") && channel.parentID === process.env.DISCORD_BDO_CHANNEL_ID);

    const scheduler = new Scheduler(TIMEOUT_MS, () => {
        channelName = getNewName();
        utils.log(`New channel name: ${channelName}`);
        channel.setName(channelName, "Updating world boss timer.")
            .then(c => utils.log(`Channel name updated to: ${c.name}`))
            .catch(err => utils.log(err, { logLevel: "error" }));
    });

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
            ],
        };
        guild.channels.create(channelName, channelOptions).then(new_channel => {
            channel = new_channel;
            scheduler.start();
        });
    } else {
        scheduler.start();
    }

    function getNewName() {
        let nextSpawn = spawner.getNext();
    
        if (this.lastId != nextSpawn.id) {
            client.emit(BDO_BOSS_UPDATE, { message: nextSpawn });
            // client.emit(VOICE_ALERT, { message: "New Boss" });
            this.lastId = nextSpawn.id;
        }
    
        let eta = msToHMFormat(nextSpawn.eta);
        let names = nextSpawn.bosses.bosses.map(boss => boss.name).join("/");

        return `[${eta.hour}:${eta.minute}] ${names}`;
    }
});

client.on(BDO_BOSS_UPDATE, data => {
    let spawnTime = data.message.bosses;

    let timeURL = `https://time.is/compare/${pad2(data.message.date.getHours())}${pad2(data.message.date.getMinutes())}_${data.message.date.getDate()}_${months[data.message.date.getMonth()]}_${data.message.date.getFullYear()}_in_EDT`;

    spawnTime.bosses.forEach(boss => {
        const embed_msg = new Discord.MessageEmbed()
            .setColor('#ff0000')
            .setTitle("Next World Boss")
            .setURL("https://mmotimer.com/bdo/?server=na")
            .setAuthor("BDO Daily", "https://cdn.discordapp.com/app-icons/712781321180545114/d3d5fef8113ef8758e4f7d2a091a5e75.png?size=256", "http://www.bdodaily.com/")
            .setDescription(`${boss.name} will be spawning at [${dateFormat(data.message.date, "longTime")}](${timeURL})`)
            .setThumbnail(boss.icon)
            .setImage(boss.map)
            .setTimestamp();
    
        client.channels.cache.get(process.env.DISCORD_BDO_MSG_CHANNEL_ID).send(embed_msg);
    });
});

client.on(VOICE_ALERT, data => {
    client.channels.cache.get(process.env.DISCORD_BDO_VOICE_CHANNEL_ID).join()
        .then(connection => {
        })
        .catch(err => console.log(err));
});

client.login(process.env.DISCORD_BOT_TOKEN);

function msToHMFormat(ms) {
    let hours_left = Math.floor(ms / (1000 * 60 * 60));
    let minutes_left = Math.floor((ms / (1000 * 60)) % 60);
    return {
        hour: pad2(hours_left),
        minute: pad2(minutes_left)
    }
}

function pad2(number) {
    return (number < 10 ? '0' : '') + number
}