const Discord = require("discord.js"),
    fs = require('fs'),
    path = require('path'),
    axios = require('axios'),
    client = new Discord.Client(),
    TelegramBot = require('node-telegram-bot-api'),
    discordChat = [],
    { Pool, Client } = require('pg'),
    bd = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'Q3Stats',
        password: '1379',
        port: 5432,
    }),
    bans = "lagz-sr, p, anus, BornToLose, Roadto800elo, TaksaDudel, +WWWWWWWWWWWWWWW, klavz xuyavz",
    bot = new TelegramBot(`1278792395:AAHk8mFilPMfV70UQXg4RNGXwxdZxBgbyQ4`, { polling: true }),
    admins = "149521299562037249";

let asTable = require('as-table').configure({ delimiter: ' | ' }), id = 0, who = "", All_games = [], all_pl = [];

bd.connect();

let pickups = [
    {
        mode: "🧊 DUEL 1v1",
        server: "q3msk.ru:27978",
        players: [],
        need: 2,
        games: [],
        play: false,
        maps: ["pro-q3dm6", "ztn3tourney1", "oxodm54", "oxodm100", "jaxdm8", "cybdmpro2", "ts_ca1", "oxodm14", "m4"]
    },
    {
        mode: "🧊 FTAG 2v2",
        server: "q3msk.ru:27978",
        players: [],
        need: 4,
        games: [],
        play: false,
        maps: ["pro-q3dm6", "ztn3tourney1", "oxodm54", "rmx-oxodm54", "oxodm100", "jaxdm8", "cybdmpro2", "ts_ca1", "rmx-ts_ca1", "oxodm14", "m4"]
    }, {
        mode: "🧊 FTAG 3v3",
        server: "q3msk.ru:27978",
        players: [],
        need: 6,
        games: [],
        play: false,
        maps: ["pro-q3dm6", "ztn3tourney1", "oxodm54", "rmx-oxodm54", "oxodm100", "jaxdm8", "cybdmpro2", "ts_ca1", "rmx-ts_ca1", "oxodm14", "m4"]
    },
    {
        mode: "🧊 FTAG 4v4",
        server: "q3msk.ru:27978",
        players: [],
        need: 8,
        games: [],
        play: false,
        maps: ["6++", "overkill", "servitude", "rmx-servitude", "oxodm32", "ts_ca1", "rmx-ts_ca1", "oxodm90", "rmx-oxodm90", "oxodm68", "rmx-oxodm68", "oxodm15", "monastery"]
    },
    {
        mode: "🧊 FTAG 5v5",
        server: "q3msk.ru:27978",
        players: [],
        need: 10,
        games: [],
        play: false,
        maps: ["6++", "overkill", "servitude", "rmx-servitude", "oxodm32", "ts_ca1", "rmx-ts_ca1", "oxodm15", "oxodm68", "rmx-oxodm68", "monastery"]
    }
]

//telegram
bot.on('message', (msg) => {
    let m = msg.text.split("@Q3Slash_bot").join("").split(" ");

    if (m[0] == "/help") {
        bot.sendMessage(msg.chat.id, `
        /stats (s) [id] - отобразить статистику игры 
/profile (p) [nick] - профиль игрока
/history (h) - история игр
/top (t) [dmg/mg/sg/gl/rl/lg/rg/pg] - лидерборд по оружию/дамагу
/discord - последние сообщения с дискорда
/who - игроки в пикапе
        `);
    }

    if (m[0] == "/discord") {
        let text = "Discord chat:";
        let data = discordChat.splice(0, 20);
        data.forEach((m) => {
            text += `\n${m.nick}: ${m.text.split("**").join("")}`;
        })
        bot.sendMessage(msg.chat.id, `${text}`, { parse_mode: "Markdown" });
    }

    if (m[0] == "/who") {
        let text = `Freeze Tag pickups:${who.split("**").join("").split("| ").join("").split("4v4").join("\n4v4").split("5v5").join("\n5v5").split("3v3").join("\n3v3")}`;
        bot.sendMessage(msg.chat.id, `${text}`, { parse_mode: "Markdown" });
    }

    if (m[0] === "/top" || m[0] === "/t") {
        let cmd = m[1];
        let page = m[2] != undefined ? +m[2] - 1 : 0;
        if (cmd) {
            if (cmd == "elo") {
                let list = listTopElo();
                let info = [
                    ["#", "Player", "Unfreez", "DMG Round", "ELO", "ALL"],
                    ["-------", "-------", "-------", "-------", "-------", "-------"]
                ];

                let numPage = (list.length / 20).toFixed(0);
                list = list.splice(20 * page, 20);

                let num = 1 + 20 * page;
                list.forEach((p, ind) => {
                    if (info.length < 22) {
                        info.push([num, p.info.nick, `${p.thwAVG.toFixed(1)}`, p.damageAVGRound.toFixed(1), p.elo.toFixed(0), p.eloAVG]);
                        num++;
                    }
                })

                let result = asTable(info);

                bot.sendMessage(msg.chat.id, `Top players (ELO) [${page + 1}/${numPage == 0 ? 1 : numPage}]:\n` + "```" + result + "```", { parse_mode: "Markdown" })

            } else if (cmd == "dmg") {
                let list = listTopDmg();
                let info = [
                    ["#", "Player", "K/D/U", "DMG Game", "DMG Round"],
                    ["-------", "-------", "-------", "-------", "-------"]
                ];

                let numPage = (list.length / 20).toFixed(0);
                list = list.splice(20 * page, 20);

                let num = 1 + 20 * page;
                list.forEach((p, ind) => {
                    if (info.length < 22) {
                        info.push([num, p.info.nick, `${p.info.kills}/${p.info.deaths}/${p.info.thw}`, p.damageAVG, p.damageAVGRound]);
                        num++;
                    }
                })

                let result = asTable(info);

                bot.sendMessage(msg.chat.id, `Top players (DamageAVG) [${page + 1}/${numPage == 0 ? 1 : numPage}]:\n` + "```\n" + result + "```", { parse_mode: "Markdown" })
            } else {
                let weap = getWeapName(cmd);

                let list = listTopWeapons(weap.name);

                let info = [
                    ["#", "Player", "K/D", "Hits/miss", "ACC"],
                    ["-------", "-------", "-------", "-------", "-------"]
                ];

                let numPage = (list.length / 20).toFixed(0);
                list = list.splice(20 * page, 20);

                let num = 1 + 20 * page;
                list.forEach((p, ind) => {
                    if (info.length < 22) {
                        info.push([num, p.info.nick, `${p.kills}/${p.deaths}`, `${p.hits}/${p.miss}`, `${p.acc}%`]);
                        num++;
                    }
                })

                let result = asTable(info);

                bot.sendMessage(msg.chat.id, `Top players (${weap.name.split(":").join("")}) [${page + 1}/${numPage == 0 ? 1 : numPage}]:\n` + "```\n" + result + "```", { parse_mode: "Markdown" })
            }
        } else {
            let list = listTopDmg();
            let info = [
                ["#", "Player", "K/D/U", "DMG Game", "DMG Round"],
                ["-------", "-------", "-------", "-------", "-------"]
            ];

            let numPage = (list.length / 20).toFixed(0);
            list = list.splice(20 * page, 20);

            let num = 1 + 20 * page;
            list.forEach((p, ind) => {
                if (info.length < 22) {
                    info.push([num, p.info.nick, `${p.info.kills}/${p.info.deaths}/${p.info.thw}`, p.damageAVG, p.damageAVGRound]);
                    num++;
                }
            })

            let result = asTable(info);


            bot.sendMessage(msg.chat.id, `Top players (DamageAVG) [${page + 1}/${numPage == 0 ? 1 : numPage}]:\n` + "```\n" + result + "```", { parse_mode: "Markdown" })
        }
    }

    if (m[0] == "/history" || m[0] == "/h") {
        let page = m[1] != undefined ? +m[1] - 1 : 0;
        let info = [
            ["#", "DATE", "MAP", "SCORE"],
            ["-------", "-------", "-------", "-------"]
        ];
        fs.readdirSync("data").filter((a) => a.indexOf(".json") > -1).sort((a, b) => {
            if (+a.split(".json").join("") > +b.split(".json").join("")) return -1;
            if (+a.split(".json").join("") == +b.split(".json").join("")) return 0;
            if (+a.split(".json").join("") < +b.split(".json").join("")) return 1;
        }).forEach((f, ind) => {
            let data = JSON.parse(fs.readFileSync(`data/${f}`).toString());
            info.push([`${+f.split(".json").join("") + 1}`, `${data.date}`, `${data.map}`, `🔴 ${data.score.red} - ${data.score.blue} 🔵`]);
        })

        let numPage = (info.length / 20).toFixed(0);
        info = info.splice(20 * page, 20);

        let result = asTable(info);
        bot.sendMessage(msg.chat.id, `Games history (${page + 1}/${numPage}):` + "```\n" + result + "```", { parse_mode: "Markdown" });
    }

    if (m[0] == "/stats" || m[0] == "/s") {
        if (m[1] != undefined) {
            bot.sendMessage(msg.chat.id, JSON.parse(fs.readFileSync(`data/${+m[1] - 1}.json`).toString()).txt, { parse_mode: "Markdown" });
        }
    }

    if (m[0] == "/profile" || m[0] == "/p") {
        if (m[1]) {
            let nick = m[1].toLowerCase();
            let profile = {
                nick: "",
                kills: 0,
                deaths: 0,
                thw: 0,
                win: 0,
                lose: 0,
                damageGiven: 0,
                damageRecvd: 0,
                "weaponStats": {
                    "MachineGun": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "Shotgun": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "G.Launcher": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "R.Launcher": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "LightningGun:": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "Railgun": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "Plasmagun": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    }
                }
            }
            fs.readdirSync("data").filter((a) => a.indexOf(".json") > -1).forEach((f, ind) => {
                let data = JSON.parse(fs.readFileSync(`data/${f}`).toString());
                data.players.forEach((p, i) => {
                    if (bans.indexOf(p.nick) > -1) return;
                    if (p.nick.toLowerCase().indexOf(nick) > -1) {
                        profile.nick = p.nick;
                        profile.kills += p.kills;
                        profile.deaths += p.deaths;
                        profile.thw += p.thw;
                        profile.win += p.gameWin == true ? 1 : 0;
                        profile.lose += p.gameWin == false ? 1 : 0;
                        profile.damageGiven += p.damageGiven;
                        profile.damageRecvd += p.damageRecvd;
                        for (key in profile.weaponStats) {
                            if (!p.weaponStats[key]) continue;
                            profile.weaponStats[key].hits += p.weaponStats[key].hits;
                            profile.weaponStats[key].miss += p.weaponStats[key].miss;
                            profile.weaponStats[key].kills += p.weaponStats[key].kills;
                            profile.weaponStats[key].deaths += p.weaponStats[key].deaths;
                            profile.weaponStats[key].acc = +((+profile.weaponStats[key].hits / +profile.weaponStats[key].miss) * 100).toFixed(1);
                        }
                    }
                })
            })
            if (profile.nick == "") return bot.sendMessage(msg.chat.id, `Error: cant find player.`)
            if ((profile.lose + profile.win) < 10) return bot.sendMessage(msg.chat.id, `Error: You need play 5 calibration games.`)
            bot.sendMessage(msg.chat.id, `
⚔ ${profile.nick}
WinRate: ${((profile.win / (profile.lose + profile.win)) * 100).toFixed(0)}% (${profile.win} - ${profile.lose})
KDU: ${profile.kills}/${profile.deaths}/${profile.thw}
ELO: ${findTopElo(profile.nick).elo} [#${findTopElo(profile.nick).id}]
DMG Round: ${findTopDmg(profile.nick).damageAVGRound} [#${findTopDmg(profile.nick).id}]
DMG Game: ${findTopDmg(profile.nick).damageAVG}\n
MachineGun: ${findTopWeapons("MachineGun", profile.nick).acc}% [#${findTopWeapons("MachineGun", profile.nick).id}]
Shotgun: ${findTopWeapons("Shotgun", profile.nick).acc}% [#${findTopWeapons("Shotgun", profile.nick).id}]
G.Launcher: ${findTopWeapons("G.Launcher", profile.nick).acc}% [#${findTopWeapons("G.Launcher", profile.nick).id}]
R.Launcher: ${findTopWeapons("R.Launcher", profile.nick).acc}% [#${findTopWeapons("R.Launcher", profile.nick).id}]
LightningGun: ${findTopWeapons("LightningGun:", profile.nick).acc}% [#${findTopWeapons("LightningGun:", profile.nick).id}]
Railgun: ${findTopWeapons("Railgun", profile.nick).acc}% [#${findTopWeapons("Railgun", profile.nick).id}]
Plasmagun: ${findTopWeapons("Plasmagun", profile.nick).acc}% [#${findTopWeapons("Plasmagun", profile.nick).id}]
`);
        } else {
            bot.sendMessage(msg.chat.id, `Please type nick. Example "/profile asuna"`)
        }
    }
})


//discord
client.on("ready", async () => {
    console.log(`Bot has started.`);
    client.user.setActivity(`pickup.xq3e.ru`);
    let temp = await bd.query(`SELECT * FROM "public"."matches" ORDER BY "id" DESC`);
    All_games = temp.rows;
    all_pl = await bd.query(`SELECT * FROM "players"`);
    all_pl = all_pl.rows;
});

client.on('guildMemberAdd', member => {
    console.log(member);
    client.channels.cache.get('755678500576428125').send(`**${member.user.username}**, приветствуем на сервере **Russian Quake 3 Freeze Pickup**! Перед тем, как начать играть **необходимо ознакомиться** с правилами на канале #rules и внимательно прочесть #faq и #faq-pickup-bot. Желаем интересных игр и ярких побед!`);
})


client.on('voiceStateUpdate', async (oldMember, newMember) => {
    const pickup = [client.channels.cache.get("773528610043723797"), client.channels.cache.get("773998892463292436"), client.channels.cache.get("773507161778814976"), client.channels.cache.get("773515480782602271"), client.channels.cache.get("773515517365059614")];
    const textChannel = client.channels.cache.get('755686789414649906');


    let pickupsMas = [];
    let start = false;
    let change = false;
    pickup.forEach((pick, ind) => {
        pick.members.forEach(async user => {
            if (all_pl.find(a => a.discord_id == user.user.id) == undefined) {

            } else {
                let p = pickups[ind];
                let pl = all_pl.find(a => a.discord_id == user.user.id);
                if (p.players.find(a => a.nick == pl.nick) == undefined) {
                    p.players.push(pl);
                    change = true;
                }
            };
        })

    })

    pickups.forEach((p, ind) => {
        let list = [];
        let mode = p.mode.split(" ")[2];
        p.players.sort((a, b) => +a.elo - +b.elo).reverse().forEach(async i => {
            list.push("**`" + `${i.nick} (${i.elo})` + "`**");
        })

        if (p.players.length == 0) return;

        if (p.need == p.players.length) {
            startPickup(p, ind);
            start = true;
            return
        }

        if (list.toString().split(",").join("\n") != "") {
            pickupsMas.push({
                name: `${p.mode} [${p.players.length}/${p.need}]`,
                value: list.toString().split(",").join("\n"),
                inline: true
            })
        }
    })

    const embed = {
        "title": `PickUps:`,
        "color": randColor(),
        "fields": pickupsMas
    }
    if (!start && change) textChannel.send(``, { embed: embed })
})

client.on("message", async message => {
    if (message.author.username == "Pubobot" && message.content.indexOf("[") > -1) {
        who = message.content;
    }
    discordChat.push({ nick: message.author.username, text: message.content });
    if (message.author.bot) return;
    let command = message.content.split(" ")[0].toLowerCase();
    let m = message.content;

    if (admins.indexOf(message.author.id) > -1) {
        if (command == "/rename") {
            const m = await message.channel.send("Loading...");
            let oldNick = message.content.split(" ")[1];
            let newNick = message.content.split(" ")[2];
            if (oldNick != undefined && newNick != undefined) {
                fs.readdirSync("data").forEach((f, ind) => {
                    let data = fs.readFileSync(`data/${f}`).toString();
                    if (data.indexOf(oldNick) > -1) {
                        data = data.split(oldNick).join(newNick);
                        fs.writeFileSync(`data/${f}`, data);
                    }
                })
                m.edit(`Done: ${oldNick} changed to ${newNick}`);
            } else {
                m.edit(`Error: nick is undefined.`);
            }
        }
    }

    if (command == "/test") {
        if (message.member.voice.channel) {
            const connection = await message.member.voice.channel.join();

            message.member.voice.channel.join().then(connection => {
                console.log("Joined voice channel!");

                const dispatcher = connection.play(require("path").join(__dirname, './test.mp3'));

                dispatcher.on('start', () => { //not working
                    dispatcher.setVolume(1);
                    console.log("Playing");
                });

                dispatcher.on('error', (err) => console.log(err)); //no errors

                dispatcher.on('finish', end => { //working fine
                    console.log("Finished");
                    console.log("End: " + end);
                    message.member.voiceChannel.leave()
                })
            }).catch(err => console.log(err));

        } else {
            message.reply('You need to join a voice channel first!');
        }
    }

    if (command.indexOf("+") > -1) {
        if (message.channel.id != 755686789414649906) return;
        if (m.indexOf("1v1") == -1 && m.indexOf("2v2") == -1 && m.indexOf("3v3") == -1 && m.indexOf("4v4") == -1 && m.indexOf("5v5") == -1) return;
        try {
            let pickupsMas = [];
            let start = false;
            let pl = await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.author.id]);
            pickups.forEach(async (p, ind) => {
                let list = [];
                let mode = p.mode.split(" ")[2];

                if (m.indexOf(mode) > -1 && p.players.find(a => a.nick == pl.rows[0].nick) == undefined) p.players.push(pl.rows[0]);
                if (p.players.length == 0) return;

                p.players.sort((a, b) => +a.elo - +b.elo).reverse().forEach(async i => {
                    list.push("**`" + `${i.nick} (${i.elo})` + "`**");
                })

                if (p.need == p.players.length) {
                    startPickup(p);
                    start = true;
                    return
                }

                if (list.toString().split(",").join("\n") != "") {
                    pickupsMas.push({
                        name: `${p.mode} [${p.players.length}/${p.need}]`,
                        value: list.toString().split(",").join("\n"),
                        inline: true
                    })
                }
            })


            const embed = {
                "title": `PickUps:`,
                "color": randColor(),
                "fields": pickupsMas
            }
            if (!start) message.channel.send(``, { embed: embed })
        } catch (er) {
            console.log(er);
        }
    }

    if (command.indexOf("++") > -1) {
        if (message.channel.id != 755686789414649906) return;
        try {
            let pickupsMas = [];
            let start = false;
            let pl = await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.author.id]);
            let needP = pickups[0];
            pickups.forEach((p, ind) => {
                if (needP.players < p.players) {
                    needP = p;
                }
            })

            needP.forEach(async (p, ind) => {
                let list = [];

                if (p.players.find(a => a.nick == pl.rows[0].nick) == undefined) p.players.push(pl.rows[0]);
                if (p.players.length == 0) return;

                p.players.sort((a, b) => +a.elo - +b.elo).reverse().forEach(async i => {
                    list.push("**`" + `${i.nick} (${i.elo})` + "`**");
                })

                if (p.need == p.players.length) {
                    startPickup(p);
                    start = true;
                    return
                }

                if (list.toString().split(",").join("\n") != "") {
                    pickupsMas.push({
                        name: `${p.mode} [${p.players.length}/${p.need}]`,
                        value: list.toString().split(",").join("\n"),
                        inline: true
                    })
                }
            })


            const embed = {
                "title": `PickUps:`,
                "color": randColor(),
                "fields": pickupsMas
            }
            if (!start) message.channel.send(``, { embed: embed })
        } catch (er) {
            console.log(er);
        }
    }

    if (command == "--") {
        let pickupsMas = [];
        let pl = await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.author.id]);
        pickups.forEach(async (p, ind) => {
            let list = [];
            let mode = p.mode.split(" ")[2];

            if (p.players.find(a => a.nick == pl.rows[0].nick) != undefined) {
                p.players = p.players.filter(a => a.discord_id != message.author.id);
            }

            if (p.players.length == 0) return;

            p.players.sort((a, b) => +a.elo - +b.elo).reverse().forEach(async i => {
                list.push("**`" + `${i.nick} (${i.elo})` + "`**");
            })


            if (list.toString().split(",").join("\n") != "") {
                pickupsMas.push({
                    name: `${p.mode} [${p.players.length}/${p.need}]`,
                    value: list.toString().split(",").join("\n"),
                    inline: true
                })
            }
        })

        const embed = {
            "title": `PickUps:`,
            "color": randColor(),
            "fields": pickupsMas
        }
        message.channel.send(``, { embed: embed })
    }

    if (command.indexOf("-") > -1) {
        if (message.channel.id != 755686789414649906) return;
        if (m.indexOf("1v1") == -1 && m.indexOf("2v2") == -1 && m.indexOf("3v3") == -1 && m.indexOf("4v4") == -1 && m.indexOf("5v5") == -1) return;
        try {
            let pickupsMas = [];
            let pl = await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.author.id]);
            pickups.forEach(async (p, ind) => {
                let list = [];
                let mode = p.mode.split(" ")[2];

                if (m.indexOf(mode) > -1 && p.players.find(a => a.nick == pl.rows[0].nick) != undefined) {
                    p.players = p.players.filter(a => a.discord_id != message.author.id);
                }

                if (p.players.length == 0) return;

                p.players.sort((a, b) => +a.elo - +b.elo).reverse().forEach(async i => {
                    list.push("**`" + `${i.nick} (${i.elo})` + "`**");
                })


                if (list.toString().split(",").join("\n") != "") {
                    pickupsMas.push({
                        name: `${p.mode} [${p.players.length}/${p.need}]`,
                        value: list.toString().split(",").join("\n"),
                        inline: true
                    })
                }
            })

            const embed = {
                "title": `PickUps:`,
                "color": randColor(),
                "fields": pickupsMas
            }
            message.channel.send(``, { embed: embed })
        } catch (er) {
            console.log(er);
        }
    }


    if(message.content.indexOf("/") == -1 && message.content.indexOf("\\") == -1) return;

    command = command.split("/").join("").split("\\").join("")

    if (command == "who" || command == "w" || command == "кто") {
        if (message.channel.id != 755686789414649906) return;
        const s = await message.channel.send("Loading pickups...");
        let pickupsMas = [];
        pickups.forEach(async (p, ind) => {
            let list = [];

            if (p.players.length == 0) return;

            p.players.sort((a, b) => +a.elo - +b.elo).reverse().forEach(async i => {
                list.push("**`" + `${i.nick} (${i.elo})` + "`**");
            })


            if (list.toString().split(",").join("\n") != "") {
                pickupsMas.push({
                    name: `${p.mode} [${p.players.length}/${p.need}]`,
                    value: list.toString().split(",").join("\n").length > 0 ? list.toString().split(",").join("\n") : "No one",
                    inline: true
                })
            }
        })

        const embed = {
            "title": `PickUps:`,
            "color": randColor(),
            "fields": pickupsMas
        }
        s.edit(``, { embed: embed })

    }

    if (command == "maps" || command == "карты" || command == "ьфзы" || command == ".ьфзы") {
        if (message.channel.id != 755686789414649906) return;
        const s = await message.channel.send("Loading pickups...");
        let pickupsMas = [];
        pickups.forEach((p, ind) => {
            pickupsMas.push({
                name: `${p.mode} [${p.players.length}/${p.need}]`,
                value: `**${p.maps.toString().split(",").join("\n")}**`,
                inline: true
            })
        })

        const embed = {
            "title": `PickUps:`,
            "color": randColor(),
            "fields": pickupsMas
        }
        s.edit(``, { embed: embed })

    }


    if (command === "expire" || command == "e" || command == "у") {
        if (message.channel.id != 755686789414649906) return;
        try {
            let pickupsMas = [];
            let time = message.content.split(" ")[1] ? message.content.split(" ")[1] : 10;
            let pl = await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.author.id]);
            pickups.forEach(async (p, ind) => {
                let list = [];
                let mode = p.mode.split(" ")[2];

                if (p.players.find(a => a.nick == pl.rows[0].nick) != undefined) {
                    setTimeout(() => {
                        p.players = p.players.filter(a => a.discord_id != message.author.id);
                    }, time * 1000 * 60)
                }

                if (p.players.length == 0) return;

                p.players.sort((a, b) => +a.elo - +b.elo).reverse().forEach(async i => {
                    list.push("**`" + `${i.nick} (${i.elo})` + "`**");
                })


            })
            setTimeout(() => {
                message.channel.send(`<@!${message.author.id}>, you have been removed from all pickups as your !expire time ran off...`)
            }, time * 1000 * 60)
            message.channel.send(`You will be removed in ${time}m.`)
        } catch (er) {
            console.log(er);
        }
    }


    if (command === "ping") {
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms.`);
    }

    if (command === "recent" || command === "r" || command == "к" || command == "кусуте") {
        const m = await message.channel.send("Loading...");
        let allPlayers = await getRecent();
        const res = message.content.split(" ")[1] == undefined ? await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.author.id]) : await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.mentions.users.first().id])
        if (res.rows.length > 0) {
            let recentMas = allPlayers.find((a) => a.info.nick == res.rows[0].nick);
            let recent = [];
            for (let ind = 0; ind < 12; ind++) {
                allPlayers = [];
                let games = recentMas.gamesMass.slice(ind, 49 + ind);
                games.reverse().forEach((data) => {
                    mas = data.data;
                    let score = mas.score.blue + mas.score.red;
                    mas.players.forEach((p, i) => {
                        if (bans.indexOf(p.nick) > -1) return;
                        if (allPlayers.find((a) => a.info.nick == p.nick) != undefined) {
                            allPlayers.find((a) => a.info.nick == p.nick).damage.push(p.damageGiven);
                            allPlayers.find((a) => a.info.nick == p.nick).games += 1;
                            allPlayers.find((a) => a.info.nick == p.nick).map = mas.map != undefined ? mas.map : "";
                            allPlayers.find((a) => a.info.nick == p.nick).MapgameWin = p.gameWin;
                            allPlayers.find((a) => a.info.nick == p.nick).id = data.id;
                            allPlayers.find((a) => a.info.nick == p.nick).score += score;
                            allPlayers.find((a) => a.info.nick == p.nick).info.kills += p.kills;
                            allPlayers.find((a) => a.info.nick == p.nick).info.deaths += p.deaths;
                            allPlayers.find((a) => a.info.nick == p.nick).thw += p.thw;
                            allPlayers.find((a) => a.info.nick == p.nick).elo += p.gameWin == true ? 15 : -15;
                        } else {
                            allPlayers.push({ thw: p.thw, id: 0, score: score, games: 1, map: "", gameWin: false, elo: 1000, info: p, damage: [p.damageGiven] });
                            allPlayers.find((a) => a.info.nick == p.nick).info.kills = p.kills;
                            allPlayers.find((a) => a.info.nick == p.nick).info.deaths = p.deaths;
                        }
                        allPlayers.find((a) => a.info.nick == p.nick).playersLength = mas.players.length;
                    })
                })
                allPlayers.forEach((p, i) => {
                    p.damageAll = 0;
                    p.damage.filter(a => a > 0).forEach(d => {
                        p.damageAll += d;
                    })
                    p.damageAVG = +`${(p.damageAll / p.damage.length)}`
                    p.damageAVGRound = +`${(p.damageAll / p.score)}`
                    p.thwAVG = +`${(+p.thw / p.games)}`
                    p.eloAVG = +`${(((+p.damageAVGRound * 10) + +p.elo + (+p.thwAVG * 100)) / 3).toFixed(0)}`
                })
                let player = allPlayers.find((a) => a.info.nick == res.rows[0].nick);
                recent.push(player);
            }
            recent = recent;
            let result = [];
            for (let ind = 0; ind < recent.length; ind++) {
                let p = recent[ind];
                let mode = "3v3";
                if (p.playersLength > 6) mode = "4v4";
                if (p.playersLength > 8) mode = "5v5";
                if (ind > 0) {
                    let old = recent[ind - 1];
                    let sum = +old.eloAVG.toFixed(0) - +p.eloAVG.toFixed(0);
                    let dmgSum = +p.damageAVGRound.toFixed(1) - old.damageAVGRound.toFixed(1);
                    result.push({
                        name: `${p.MapgameWin == true ? ":white_check_mark: Win" : ":x: Lose"} - ${p.map} (${mode})`,
                        value: `ID: ` + "`" + `${p.id}` + "`" + `\nELO: ` + "`" + `${p.eloAVG.toFixed(0)} ->  ${old.eloAVG.toFixed(0)}(${sum > 0 ? "+" : ""}${sum})` + "`" + `\nDMG Round:\n` + "`" + `${old.damageAVGRound.toFixed(1)} -> ${p.damageAVGRound.toFixed(1)}(${dmgSum > 0 ? "+" : ""}${dmgSum.toFixed(1)})` + "`",
                        inline: true
                    })
                } else {
                    let sum = +res.rows[0].elo.toFixed(0) - +p.eloAVG.toFixed(0);
                    let dmgSum = +res.rows[0].damage_round.toFixed(1) - +p.damageAVGRound.toFixed(1);
                    result.push({
                        name: `${p.MapgameWin == true ? ":white_check_mark: Win" : ":x: Lose"} - ${p.map} (${mode})`,
                        value: `ID: ` + "`" + `${p.id}` + "`" + `\nELO: ` + "`" + `${p.eloAVG.toFixed(0)} -> ${res.rows[0].elo.toFixed(0)}(${sum > 0 ? "+" : ""}${sum})` + "`" + `\nDMG Round:\n` + "`" + `${p.damageAVGRound.toFixed(1)} -> ${res.rows[0].damage_round.toFixed(1)}(${dmgSum > 0 ? "+" : ""}${dmgSum.toFixed(1)})` + "`",
                        inline: true
                    })
                };
            }
            const embed = {
                "title": `Recent games for **${res.rows[0].nick}**`,
                "color": randColor(),
                "fields": result
            }
            m.edit(``, { embed: embed })
        }
    }

    if (command === "register") {
        if (m.split(" ")[1] == undefined) return message.channel.send("Type nick!!! Example: `/register Asuna`")
        register(message.author.id, m.split(" ")[1])
        message.channel.send(`Register completed.`);
    }

    if (command === "profile" || command === "p" || command == "з" || command == ".з") {
        const m = await message.channel.send(`Loading profile...`);
        try {
            const res = message.content.split(" ")[1] == undefined ? await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.author.id]) : await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [message.mentions.users.first().id])
            if (res.rows.length > 0) {
                let d = res.rows[0];
                let profile = {
                    nick: d.nick,
                    kills: +d.kills,
                    deaths: +d.deaths,
                    thw: +d.thw,
                    win: +d.win,
                    lose: +d.lose,
                    elo: 0,
                    damage: {
                        game: +d.damage_game,
                        round: +d.damage_round,
                        all: +d.damage_all
                    },
                    matches: d.matches.toString().split(", "),
                    "weaponStats": d.weapons
                };
                if (profile.nick == "") return m.edit(`Error: cant find player.`)
                if ((profile.lose + profile.win) < 5) return m.edit(`Error: You need play ${5 - (profile.lose + profile.win)} calibration games.`);
                let dmg = findTopDmg(profile.nick);
                let dmg3v3 = findTopDmg(profile.nick, "3v3");
                let dmg4v4 = findTopDmg(profile.nick, "4v4");
                let dmg5v5 = findTopDmg(profile.nick, "5v5");
                let weaponsStatsText = [];
                for (we in profile.weaponStats) {
                    if (+profile.weaponStats[we].acc > 0) {
                        let wep = findTopWeapons(we, profile.nick);
                        let place = wep.id;
                        let name = wep.data;
                        wep = wep.info;
                        profile.weaponStats[we].acc = +wep.acc;
                        profile.weaponStats[we].hits = +wep.hits;
                        profile.weaponStats[we].miss = +wep.miss;
                        profile.weaponStats[we].kills = +wep.kills;
                        profile.weaponStats[we].deaths = +wep.deaths;
                        weaponsStatsText.push({
                            name: `${name.icon} ${name.name.split(":").join("")}`,
                            value: `<:accuracy:774074537712549908> ` + "`" + `${wep.acc}%` + "`" + ` **[#${place}]** \nHits: ` + "`" + `${profile.weaponStats[we].hits}` + "`" + `\tShots: ` + "`" + `${profile.weaponStats[we].miss}` + "`\nKills: " + "`" + `${profile.weaponStats[we].kills}` + "`" + `\tDeaths: ` + "`" + `${profile.weaponStats[we].deaths}` + "`",
                            inline: true
                        })
                    }
                }
                const result = await bd.query('UPDATE players SET(nick, damage_game, damage_round, weapons) = ($1, $2, $3, $4) WHERE nick = $1', [profile.nick, dmg.damageAVG, dmg.damageAVGRound, profile.weaponStats]);
                let elo = findTopElo(profile.nick);
                let elo3v3 = findTopElo(profile.nick, "3v3");
                let elo4v4 = findTopElo(profile.nick, "4v4");
                let elo5v5 = findTopElo(profile.nick, "5v5");
                const embed = {
                    "author": {
                        "name": profile.nick,
                        // "icon_url": "https://i.imgur.com/uq3PyN4.jpg"
                    },
                    "description": "```css\n" + `ELO      : ${elo.elo} [#${elo.id}]
WinRate  : ${((elo.info.win / (elo.info.lose + elo.info.win)) * 100).toFixed(0)}%  (win: ${profile.win} | lose: ${profile.lose}) 
└─[3v3]  : ${((elo3v3.info.win / (elo3v3.info.lose + elo3v3.info.win)) * 100).toFixed(0)}%   
 └─[4v4] : ${((elo4v4.info.win / (elo4v4.info.lose + elo4v4.info.win)) * 100).toFixed(0)}%    
  └─[5v5]: ${((elo5v5.info.win / (elo5v5.info.lose + elo5v5.info.win)) * 100).toFixed(0)}% 

DMG Round: ${dmg.damageAVGRound.toFixed(0)}  [#${dmg.id}]
└─[3v3]  : ${dmg3v3.damageAVGRound.toFixed(0)}   
 └─[4v4] : ${dmg4v4.damageAVGRound.toFixed(0)}   
  └─[5v5]: ${dmg5v5.damageAVGRound.toFixed(0)}   

DMG Game : ${dmg.damageAVG.toFixed(0)}  (min: ${dmg.min} | max: ${dmg.max})
└─[3v3]  : ${dmg3v3.damageAVG.toFixed(0)}  (min: ${dmg3v3.min} | max: ${dmg3v3.max})
 └─[4v4] : ${dmg4v4.damageAVG.toFixed(0)}  (min: ${dmg4v4.min} | max: ${dmg4v4.max})
  └─[5v5]: ${dmg5v5.damageAVG.toFixed(0)}  (min: ${dmg5v5.min} | max: ${dmg5v5.max})

THW Game : ${elo.info.thwAVG.toFixed(2).split(".").join(",")}  (min: ${elo.info.min} | max: ${elo.info.max})
└─[3v3]  : ${elo3v3.info.thwAVG.toFixed(2).split(".").join(",")}  (min: ${elo3v3.info.min} | max: ${elo3v3.info.max})
 └─[4v4] : ${elo4v4.info.thwAVG.toFixed(2).split(".").join(",")}  (min: ${elo4v4.info.min} | max: ${elo4v4.info.max})
  └─[5v5]: ${elo5v5.info.thwAVG.toFixed(2).split(".").join(",")}  (min: ${elo5v5.info.min} | max: ${elo5v5.info.max})
` + "```",
                    "color": randColor(),
                    "fields": weaponsStatsText
                }
                m.edit(``, { embed: embed })
            } else {
                m.edit(`Error: cant find player.`);
            }
        } catch (er) {
            console.log(er);
            m.edit(er.toString());
        }
    }

    if (command === "help") {
        message.channel.send(`
        /stats (s) [id] - отобразить статистику игры 
/profile (p) [nick] - профиль игрока
/history (h) - история игр
/ping - pong
/top (t) [dmg/mg/sg/gl/rl/lg/rg/pg] - лидерборд по оружию/дамагу
        `);
    }

    if (command === "history" || command === "h") {
        let page = message.content.split(" ")[1] != undefined ? +message.content.split(" ")[1] - 1 : 0;
        let info = [
            ["ID", "DATE", "MAP", "SCORE"],
            ["-------", "-------", "-------", "-------"]
        ];
        try {
            bd.query(`SELECT * FROM "public"."matches" ORDER BY "id" DESC`).then(res => {
                res.rows.forEach((f, ind) => {
                    let data = f.json;
                    info.push([`${f.id}`, `${data.date}`, `${data.map}`, `🔴 ${data.score.red} - ${data.score.blue} 🔵`]);
                })

                let numPage = (info.length / 20).toFixed(0);
                info = info.splice(20 * page, 20);

                let result = asTable(info);
                message.channel.send(`Games history [${page + 1}/${numPage}]:` + "```" + result + "```");


            })
        } catch (er) {
        }
    }

    if (command === "top" || command === "t") {
        let cmd = message.content.split(" ")[1] ? message.content.split(" ")[1].toLowerCase() : "";
        let page = message.content.split(" ")[2] != undefined ? +message.content.split(" ")[2] - 1 : 0;
        if (cmd && (cmd == "dmg" || getWeapName(cmd).name != "-")) {
            if (cmd == "dmg") {
                let list = listTopDmg();

                let numPage = (list.length / 9).toFixed(0);

                list = list.splice(9 * page, 9);

                let resultText = [];
                let num = 1 + 9 * page;

                list.forEach((p, ind) => {
                    if (resultText.length < 9) {
                        let medal = `${num.toString().split("0").join("0️⃣").split("1").join("1️⃣").split("2").join("2️⃣").split("3").join("3️⃣").split("4").join("4️⃣").split("5").join("5️⃣").split("6").join("6️⃣").split("7").join("7️⃣").split("8").join("8️⃣").split("9").join("9️⃣")}`;
                        if (num == 1) medal = "🏅";
                        if (num == 2) medal = "🥈";
                        if (num == 3) medal = "🥉";
                        resultText.push({
                            name: `${medal} ${p.info.nick}`,
                            value: `DMG Round: ` + "`" + `${p.damageAVGRound}` + "`" + `\nDMG Game: ` + "`" + `${p.damageAVG}` + "`",
                            inline: true
                        })
                        num++;
                    }
                })

                const embed = {
                    "title": `Top players (DamageAVG) [${page + 1}/${numPage == 0 ? 1 : numPage}]`,
                    "color": randColor(),
                    "fields": resultText
                }

                message.channel.send({ embed: embed })
            } else {
                let weap = getWeapName(cmd);

                let list = listTopWeapons(weap.name);

                let numPage = (list.length / 9).toFixed(0);

                list = list.splice(9 * page, 9);

                let resultText = [];
                let num = 1 + 9 * page;

                list.forEach((p, ind) => {
                    if (resultText.length < 9) {
                        let medal = `${num.toString().split("0").join("0️⃣").split("1").join("1️⃣").split("2").join("2️⃣").split("3").join("3️⃣").split("4").join("4️⃣").split("5").join("5️⃣").split("6").join("6️⃣").split("7").join("7️⃣").split("8").join("8️⃣").split("9").join("9️⃣")}`;
                        if (num == 1) medal = "🏅";
                        if (num == 2) medal = "🥈";
                        if (num == 3) medal = "🥉";
                        resultText.push({
                            name: `${medal} ${p.nick}`,
                            value: `<:accuracy:774074537712549908> ` + "`" + `${p.acc}%` + "`" + `\nHits: ` + "`" + `${p.hits}` + "`" + `\tShots: ` + "`" + `${p.miss}` + "`\nKills: " + "`" + `${p.kills}` + "`" + `\tDeaths: ` + "`" + `${p.deaths}` + "`",
                            inline: true
                        })
                        num++;
                    }
                })

                const embed = {
                    "title": `${weap.icon} Top players (${weap.name.split(":").join("")}) [${page + 1}/${numPage == 0 ? 1 : numPage}]`,
                    "color": randColor(),
                    "fields": resultText
                }

                message.channel.send({ embed: embed })
            }
        } else {
            try {
                page = message.content.split(" ")[1] != undefined ? +message.content.split(" ")[1] - 1 : 0;

                let list = await listTopElo();

                for (let i = 0; i < list.length; i++) {
                    if (list[i].eloAVG.toFixed(0) > 0 && list[i].damageAVG.toFixed(1) > 0 && list[i].damageAVGRound.toFixed(1)) await bd.query('UPDATE players SET(elo, damage_game, damage_round) = ($2, $3, $4) WHERE nick = $1', [list[i].info.nick, list[i].eloAVG.toFixed(0), list[i].damageAVG.toFixed(1), list[i].damageAVGRound.toFixed(1)]);
                }

                let numPage = (list.length / 9).toFixed(0);

                list = list.splice(9 * page, 9);

                let resultText = [];
                let num = 1 + 9 * page;

                list.forEach((p, ind) => {
                    if (resultText.length < 9) {
                        let medal = `${num.toString().split("0").join("0️⃣").split("1").join("1️⃣").split("2").join("2️⃣").split("3").join("3️⃣").split("4").join("4️⃣").split("5").join("5️⃣").split("6").join("6️⃣").split("7").join("7️⃣").split("8").join("8️⃣").split("9").join("9️⃣")}`;
                        if (num == 1) medal = "🏅";
                        if (num == 2) medal = "🥈";
                        if (num == 3) medal = "🥉";
                        resultText.push({
                            name: `${medal} ${p.info.nick}`,
                            value: `ELO: ` + "`" + `${p.eloAVG.toFixed(0)}` + "`" + `\nDMG Round: ` + "`" + `${p.damageAVGRound.toFixed(1)}` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${findTopWeapons("Railgun", p.info.nick).info != undefined ? findTopWeapons("Railgun", p.info.nick).info.acc : 0}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${findTopWeapons("LightningGun:", p.info.nick).info != undefined ? findTopWeapons("LightningGun:", p.info.nick).info.acc : 0}%` + "`",
                            inline: true
                        })
                        num++;
                    }
                })

                const embed = {
                    "title": `Top players (ELO) [${page + 1}/${numPage == 0 ? 1 : numPage}]`,
                    "color": randColor(),
                    "fields": resultText
                }

                message.channel.send({ embed: embed })
            } catch (er) {
                console.log(er);
            }
        }
    }

    if (command === "stats" || command === "s") {
        if (message.content.split(" ")[1] != undefined) {
            let data = All_games.find(a => a.id == +message.content.split(" ")[1]).json;

            let stats = {
                red: {
                    kills: 0,
                    deaths: 0,
                    thw: 0,
                    damageGiven: 0,
                    damageRecvd: 0,
                    rail: 0,
                    lg: 0,
                    rocket: 0
                },
                blue: {
                    kills: 0,
                    deaths: 0,
                    thw: 0,
                    damageGiven: 0,
                    damageRecvd: 0,
                    rail: 0,
                    lg: 0,
                    rocket: 0
                }
            }

            let textRed = [{
                name: `🔴 Red Team [${data.score.red}]`,
                value: "",
                inline: true
            }];

            let textBlue = [{
                name: `[${data.score.blue}] Blue Team 🔵`,
                value: "",
                inline: true
            }];

            data.players.filter(a => a.team == "RED").sort((a, b) => {
                if (a.score > b.score) return -1;
                if (a.score == b.score) return 0;
                if (a.score < b.score) return 1;
            }).forEach((p, ind) => {
                if (p.kills == 0 && p.deaths == 0) return;
                let medal = "";
                if (findBest(data.players, "damage").nick == p.nick) medal += "<:excellent:774074572135071814> ";
                if (findBest(data.players, "Wanker").nick == p.nick) medal += "🤷‍♂️ ";
                if (p.weaponStats.Railgun) {
                    if (+p.weaponStats.Railgun.acc > 0) {
                        if (findBest(data.players, "RailGun").nick == p.nick) medal += "<:impressivse:774074631391936553> ";
                    }
                }
                if (p.weaponStats["LightingGun:"]) {
                    if (+p.weaponStats["LightingGun:"].acc > 0) {
                        if (findBest(data.players, "LightingGun").nick == p.nick) medal += "<:accuracy:774074537712549908> ";
                    }
                }
                if (findBest(data.players, "Priest").nick == p.nick) medal += "🙏 ";
                if (findBest(data.players, "Mega").nick == p.nick) medal += "<:meg:774075608548245536> ";
                if (findBest(data.players, "Red").nick == p.nick) medal += "<:red:774075574012215317> ";
                textRed[0].value += `**${p.nick}** ${medal}\n` + "" + "`" + `${p.score}(${p.kills}/${p.deaths}/${p.thw})` + "`" + "\nDMG: " + "`" + `${(p.damageGiven / 1000).toFixed(1)}/${(p.damageRecvd / 1000).toFixed(1)}к` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${p.weaponStats.Railgun.acc ? p.weaponStats.Railgun.acc : 0}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${p.weaponStats["LightningGun:"] ? p.weaponStats["LightningGun:"].acc : 0}%` + "`\n\n";
                stats.red.kills += p.kills;
                stats.red.deaths += p.deaths;
                stats.red.thw += p.thw;
                stats.red.damageGiven += p.damageGiven;
                stats.red.damageRecvd += p.damageRecvd;
                stats.red.rail += p.weaponStats.Railgun != undefined ? p.weaponStats.Railgun.acc : 0;
                stats.red.lg += p.weaponStats["LightningGun:"] != undefined ? p.weaponStats["LightningGun:"].acc : 0;
            })

            stats.red.rail = +stats.red.rail / data.players.filter(a => a.team == "RED").length;
            stats.red.lg = +stats.red.lg / data.players.filter(a => a.team == "RED").length;

            data.players.filter(a => a.team == "BLUE").sort((a, b) => {
                if (a.score > b.score) return -1;
                if (a.score == b.score) return 0;
                if (a.score < b.score) return 1;
            }).forEach((p, ind) => {
                if (p.kills == 0 && p.deaths == 0) return;
                let medal = "";
                if (findBest(data.players, "damage").nick == p.nick) medal += "<:excellent:774074572135071814> ";
                if (findBest(data.players, "Wanker").nick == p.nick) medal += "🤷‍♂️ ";
                if (p.weaponStats.Railgun) {
                    if (+p.weaponStats.Railgun.acc > 0) {
                        if (findBest(data.players, "RailGun").nick == p.nick) medal += "<:impressivse:774074631391936553> ";
                    }
                }
                if (p.weaponStats["LightingGun:"]) {
                    if (+p.weaponStats["LightingGun:"].acc > 0) {
                        if (findBest(data.players, "LightingGun").nick == p.nick) medal += "<:accuracy:774074537712549908> ";
                    }
                }
                if (findBest(data.players, "Priest").nick == p.nick) medal += "🙏 ";
                if (findBest(data.players, "Mega").nick == p.nick) medal += "<:meg:774075608548245536> ";
                if (findBest(data.players, "Red").nick == p.nick) medal += "<:red:774075574012215317> ";
                textBlue[0].value += `**${p.nick}** ${medal}\n` + "" + "`" + `${p.score}(${p.kills}/${p.deaths}/${p.thw})` + "`" + "\nDMG: " + "`" + `${(p.damageGiven / 1000).toFixed(1)}/${(p.damageRecvd / 1000).toFixed(1)}к` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${p.weaponStats.Railgun.acc ? p.weaponStats.Railgun.acc : 0}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${p.weaponStats["LightningGun:"] ? p.weaponStats["LightningGun:"].acc : 0}%` + "`\n\n";
                stats.blue.kills += p.kills;
                stats.blue.deaths += p.deaths;
                stats.blue.thw += p.thw;
                stats.blue.damageGiven += p.damageGiven;
                stats.blue.damageRecvd += p.damageRecvd;
                stats.blue.rail += p.weaponStats.Railgun != undefined ? p.weaponStats.Railgun.acc : 0;
                stats.blue.lg += p.weaponStats["LightningGun:"] != undefined ? p.weaponStats["LightningGun:"].acc : 0;
            })

            stats.blue.rail = +stats.blue.rail / data.players.filter(a => a.team == "BLUE").length;
            stats.blue.lg = +stats.blue.lg / data.players.filter(a => a.team == "BLUE").length;

            textRed[0].value += "`" + `--Totals--` + `\n${stats.red.kills}/${stats.red.deaths}/${stats.red.thw}` + "`" + "\nDMG: " + "`" + `${(stats.red.damageGiven / 1000).toFixed(1)}/${(stats.red.damageRecvd / 1000).toFixed(1)}к` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${stats.red.rail.toFixed(0)}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${stats.red.lg.toFixed(0)}%` + "`" + `\n`;

            textBlue[0].value += "`" + `--Totals--` + `\n${stats.blue.kills}/${stats.blue.deaths}/${stats.blue.thw}` + "`" + "\nDMG: " + "`" + `${(stats.blue.damageGiven / 1000).toFixed(1)}/${(stats.blue.damageRecvd / 1000).toFixed(1)}к` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${stats.blue.rail.toFixed(0)}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${stats.blue.lg.toFixed(0)}%` + "`" + `\n`;

            let result = [textRed, textBlue];
            const embed = {
                "description": `Map: ` + "`" + `${data.map}` + "`" + ` Date: ` + "`" + `${data.date}` + "`" + ` ID: ` + "`" + `${+message.content.split(" ")[1]}` + "`",
                "color": randColor(),
                "thumbnail": {
                    "url": `http://q3msk.ru/monitor/images/mapshots/Custom_Maps/Miscellaneous/${data.map}.jpg`
                },
                "fields": result
            }
            message.channel.send({ embed: embed })
            return
        }

        let Attachment = (message.attachments).array();
        const m = await message.channel.send("Loading game...");

        if (Attachment[0] == undefined) {
            m.edit(`Error: no id or stats.txt file ;c`);
            return;
        }

        download(Attachment[0].url).then(async () => {
            try {
                let data = fs.readFileSync(`game.txt`).toString();

                if (data.indexOf("COMPLETE") == -1 || data.toLowerCase().indexOf("red") == -1) return;

                stats = data.split("Map: ")[0].split("Accuracy info for: ");

                let score = { blue: 0, red: 0 };

                let table = data.split("Time Remaining: MATCH COMPLETE")[1].split("Current time:")[0];

                table.split("\n").forEach(t => {
                    if (t.indexOf("Totals") > -1) {
                        t = t.replace(/\s+/g, ' ');
                        if (t.indexOf("RED") > -1) {
                            score.red = +t.split(" ")[12].split("\n")[0];
                        } else {
                            score.blue = +t.split(" ")[12].split("\n")[0];
                        }
                    }
                })

                let red = table.split("-----------------------------------------------------------------------")[1].split("TEAM Player")[0];
                let blue = table.split("-----------------------------------------------------------------------")[3].split("-----------------------------------------------------------------------")[0];

                let map = data.split("Map: ")[1].split("\r")[0];
                let date = data.split("Current time: ")[1].split("\r")[0];

                const check = await bd.query(`SELECT * FROM "matches" WHERE date = $1`, [date]);
                if (check.rows.length > 0) return m.edit(`Error: already have ;c`);

                let players = [];

                console.log(`Parsing game - ${map} ${date}`);

                if (data.indexOf("Accuracy info for: ") == -1) stats = red.concat(blue).split("\n").filter(a => a != "\r" && a != "");

                stats.forEach((p, ind) => {
                    if (ind == 0) return;

                    // players stats
                    let obj = { nick: data.indexOf("Accuracy info for: ") > -1 ? p.split("\r")[0] : p.replace(/\s+/g, ' ').trim().split(" ")[1].split(" ")[0], kills: 0, deaths: 0, thw: 0, sui: 0, win: 0, eff: 0, score: 0 };
                    obj.team = (red.indexOf(obj.nick) > -1) ? "RED" : "BLUE";
                    if (obj.team == "RED") {
                        red.split("\n").forEach((h, k) => {
                            if (h.indexOf(obj.nick) > -1) {
                                h = h.replace(obj.nick, ' ');
                                h = h.replace(/\s+/g, ' ').trim();
                                obj.gameWin = score.red > score.blue;
                                obj.kills = +h.split(" ")[1].split(" ")[0];
                                obj.thw = +h.split(" ")[2].split(" ")[0];
                                obj.deaths = +h.split(" ")[3].split(" ")[0];
                                obj.sui = +h.split(" ")[4].split(" ")[0];
                                obj.win = +h.split(" ")[6].split(" ")[0];
                                obj.eff = +h.split(" ")[7].split(" ")[0];
                                obj.score = +h.split(" ")[11].split(" ")[0];
                            }
                        })
                    } else {
                        blue.split("\n").forEach((h, k) => {
                            if (h.indexOf(obj.nick) > -1) {
                                h = h.replace(obj.nick, ' ');
                                h = h.replace(/\s+/g, ' ').trim();
                                obj.gameWin = score.blue > score.red;
                                obj.kills = +h.split(" ")[1].split(" ")[0];
                                obj.thw = +h.split(" ")[2].split(" ")[0];
                                obj.deaths = +h.split(" ")[3].split(" ")[0];
                                obj.sui = +h.split(" ")[4].split(" ")[0];
                                obj.win = +h.split(" ")[6].split(" ")[0];
                                obj.eff = +h.split(" ")[7].split(" ")[0];
                                obj.score = +h.split(" ")[11].split(" ")[0];
                            }
                        })
                    }

                    if (data.indexOf("Accuracy info for: ") > -1) {
                        obj.armorTaken = p.split("Armor Taken : ")[1].split("\r")[0];
                        obj.healthTaken = p.split("Health Taken: ")[1].split("\r")[0];
                        obj.damageGiven = +p.split("Damage Given: ")[1].split(" ")[0];
                        obj.damageRecvd = +p.split("Damage Recvd: ")[1].split(" ")[0];
                    }

                    // weapons stats
                    if (p.indexOf("No weapon info available.") == -1 && data.indexOf("Accuracy info for: ") > -1) {
                        obj.weaponStats = {};
                        let weaponStats = p.split(`--------------------------------------------------------`)[1].split("Damage Given:")[0].split("\n");
                        weaponStats.forEach((w, i) => {
                            if (i == 0 || w.split(" ")[0] == false) return;
                            w = w.replace(/\s+/g, ' ').trim();
                            obj.weaponStats[w.split(" ")[0]] = {
                                hits: w.split(":")[1].split(" ").length > 6 ? +w.split(":")[1].split(" ")[2].split("/")[0] : 0,
                                miss: w.split(":")[1].split(" ").length > 6 ? +w.split(":")[1].split(" ")[2].split("/")[1].split(" ")[0] : 0,
                                kills: w.split(":")[1].split(" ").length > 6 ? +w.split(":")[1].split(" ")[3].split(" ")[0] : 0,
                                deaths: w.split(":")[1].split(" ").length > 6 ? +w.split(":")[1].split(" ")[4].split(" ")[0] : 0,
                            }
                            obj.weaponStats[w.split(" ")[0]].acc = Math.round((obj.weaponStats[w.split(" ")[0]].hits / obj.weaponStats[w.split(" ")[0]].miss) * 100);
                        })
                    }
                    players.push(obj);
                })

                //discord message
                let jsonBlue = [
                    ["Player", "K/D/U", "DG/DR", "LG/RG", "Score"],
                    ["-------", "-------", "-------", "-------", "-------"]
                ];

                let jsonRed = [
                    ["Player", "K/D/U", "DG/DR", "LG/RG", "Score"],
                    ["-------", "-------", "-------", "-------", "-------"]
                ];

                let totalRed = { nick: ">>> Totals", kills: 0, deaths: 0, thw: 0, damageGiven: 0, damageRecvd: 0, score: 0 };

                let totalBlue = { nick: ">>> Totals", kills: 0, deaths: 0, thw: 0, damageGiven: 0, damageRecvd: 0, score: 0 };

                players.sort((a, b) => {
                    if (a.score > b.score) return -1;
                    if (a.score == b.score) return 0;
                    if (a.score < b.score) return 1;
                }).forEach((p) => {
                    if (p.team == "RED") {
                        totalRed.kills += p.kills;
                        totalRed.deaths += p.deaths;
                        totalRed.thw += p.thw;
                        totalRed.damageGiven += p.damageGiven;
                        totalRed.damageRecvd += p.damageRecvd;
                        totalRed.score += p.score;
                        jsonRed.push([`${p.nick}`, `${p.kills}/${p.deaths}/${p.thw}`, `${p.damageGiven}/${p.damageRecvd}`, `${p.weaponStats["LightningGun:"] != undefined ? p.weaponStats["LightningGun:"].acc : 0}%/${p.weaponStats.Railgun != undefined ? p.weaponStats.Railgun.acc : 0}%`, `${p.score}`]);
                    } else {
                        totalBlue.kills += p.kills;
                        totalBlue.deaths += p.deaths;
                        totalBlue.thw += p.thw;
                        totalBlue.damageGiven += p.damageGiven;
                        totalBlue.damageRecvd += p.damageRecvd;
                        totalBlue.score += p.score;
                        jsonBlue.push([`${p.nick}`, `${p.kills}/${p.deaths}/${p.thw}`, `${p.damageGiven}/${p.damageRecvd}`, `${p.weaponStats["LightningGun:"] != undefined ? p.weaponStats["LightningGun:"].acc : 0}%/${p.weaponStats.Railgun != undefined ? p.weaponStats.Railgun.acc : 0}%`, `${p.score}`]);
                    }
                })

                jsonRed.push(["-------", "-------", "-------", "-------", "-------"]);
                jsonBlue.push(["-------", "-----", "-------", "-------", "-------"]);

                jsonRed.push([`${totalRed.nick}`, `${totalRed.kills}/${totalRed.deaths}/${totalRed.thw}`, `${totalRed.damageGiven}/${totalRed.damageRecvd}`, ``, `${totalRed.score}`]);

                jsonBlue.push([`${totalBlue.nick}`, `${totalBlue.kills}/${totalBlue.deaths}/${totalBlue.thw}`, `${totalBlue.damageGiven}/${totalBlue.damageRecvd}`, ``, `${totalBlue.score}`]);


                let resultRed = asTable(jsonRed);
                let resultBlue = asTable(jsonBlue);

                table = `🔴 RED TEAM\n${resultRed}\n\n🔵 BLUE TEAM\n${resultBlue}`;

                // fs.writeFileSync(`data/${id}.json`, JSON.stringify({ score: score, date: date, map: map, players: players, txt: "```" + `Score: 🔴 ${score.red} - ${score.blue} 🔵   Map: ${map}   Date: ${date}\n\n` + table + "```" }));

                data = { score: score, date: date, map: map, players: players, txt: "```" + `Score: 🔴 ${score.red} - ${score.blue} 🔵   Map: ${map}   Date: ${date}\n\n` + table + "```" };

                addGames(data);

                stats = {
                    red: {
                        kills: 0,
                        deaths: 0,
                        thw: 0,
                        damageGiven: 0,
                        damageRecvd: 0,
                        rail: 0,
                        lg: 0,
                        rocket: 0
                    },
                    blue: {
                        kills: 0,
                        deaths: 0,
                        thw: 0,
                        damageGiven: 0,
                        damageRecvd: 0,
                        rail: 0,
                        lg: 0,
                        rocket: 0
                    }
                }

                const id = await bd.query(`SELECT * FROM "matches" `);

                let textRed = [{
                    name: `🔴 Red Team [${data.score.red}]`,
                    value: "",
                    inline: true
                }];

                let textBlue = [{
                    name: `[${data.score.blue}] Blue Team 🔵`,
                    value: "",
                    inline: true
                }];

                data.players.filter(a => a.team == "RED").sort((a, b) => {
                    if (a.score > b.score) return -1;
                    if (a.score == b.score) return 0;
                    if (a.score < b.score) return 1;
                }).forEach((p, ind) => {
                    if (p.kills == 0 && p.deaths == 0) return;
                    let medal = "";
                    if (findBest(data.players, "damage").nick == p.nick) medal += "<:excellent:774074572135071814> ";
                    if (findBest(data.players, "Wanker").nick == p.nick) medal += "🤷‍♂️ ";
                    if (p.weaponStats.Railgun) {
                        if (+p.weaponStats.Railgun.acc > 0) {
                            if (findBest(data.players, "RailGun").nick == p.nick) medal += "<:impressivse:774074631391936553> ";
                        }
                    }
                    if (p.weaponStats["LightingGun:"]) {
                        if (+p.weaponStats["LightingGun:"].acc > 0) {
                            if (findBest(data.players, "LightingGun").nick == p.nick) medal += "<:accuracy:774074537712549908> ";
                        }
                    }
                    if (findBest(data.players, "Priest").nick == p.nick) medal += "🙏 ";
                    if (findBest(data.players, "Mega").nick == p.nick) medal += "<:meg:774075608548245536> ";
                    if (findBest(data.players, "Red").nick == p.nick) medal += "<:red:774075574012215317> ";
                    textRed[0].value += `**${p.nick}** ${medal}\n` + "" + "`" + `${p.score}(${p.kills}/${p.deaths}/${p.thw})` + "`" + "\nDMG: " + "`" + `${(p.damageGiven / 1000).toFixed(1)}/${(p.damageRecvd / 1000).toFixed(1)}к` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${p.weaponStats.Railgun.acc ? p.weaponStats.Railgun.acc : 0}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${p.weaponStats["LightningGun:"] ? p.weaponStats["LightningGun:"].acc : 0}%` + "`\n\n";
                    stats.red.kills += p.kills;
                    stats.red.deaths += p.deaths;
                    stats.red.thw += p.thw;
                    stats.red.damageGiven += p.damageGiven;
                    stats.red.damageRecvd += p.damageRecvd;
                    stats.red.rail += p.weaponStats.Railgun != undefined ? p.weaponStats.Railgun.acc : 0;
                    stats.red.lg += p.weaponStats["LightningGun:"] != undefined ? p.weaponStats["LightningGun:"].acc : 0;
                })

                stats.red.rail = +stats.red.rail / data.players.filter(a => a.team == "RED").length;
                stats.red.lg = +stats.red.lg / data.players.filter(a => a.team == "RED").length;

                data.players.filter(a => a.team == "BLUE").sort((a, b) => {
                    if (a.score > b.score) return -1;
                    if (a.score == b.score) return 0;
                    if (a.score < b.score) return 1;
                }).forEach((p, ind) => {
                    if (p.kills == 0 && p.deaths == 0) return;
                    let medal = "";
                    if (findBest(data.players, "damage").nick == p.nick) medal += "<:excellent:774074572135071814> ";
                    if (findBest(data.players, "Wanker").nick == p.nick) medal += "🤷‍♂️ ";
                    if (p.weaponStats.Railgun) {
                        if (+p.weaponStats.Railgun.acc > 0) {
                            if (findBest(data.players, "RailGun").nick == p.nick) medal += "<:impressivse:774074631391936553> ";
                        }
                    }
                    if (p.weaponStats["LightingGun:"]) {
                        if (+p.weaponStats["LightingGun:"].acc > 0) {
                            if (findBest(data.players, "LightingGun").nick == p.nick) medal += "<:accuracy:774074537712549908> ";
                        }
                    }
                    if (findBest(data.players, "Priest").nick == p.nick) medal += "🙏 ";
                    if (findBest(data.players, "Mega").nick == p.nick) medal += "<:meg:774075608548245536> ";
                    if (findBest(data.players, "Red").nick == p.nick) medal += "<:red:774075574012215317> ";
                    textBlue[0].value += `**${p.nick}** ${medal}\n` + "" + "`" + `${p.score}(${p.kills}/${p.deaths}/${p.thw})` + "`" + "\nDMG: " + "`" + `${(p.damageGiven / 1000).toFixed(1)}/${(p.damageRecvd / 1000).toFixed(1)}к` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${p.weaponStats.Railgun.acc ? p.weaponStats.Railgun.acc : 0}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${p.weaponStats["LightningGun:"] ? p.weaponStats["LightningGun:"].acc : 0}%` + "`\n\n";
                    stats.blue.kills += p.kills;
                    stats.blue.deaths += p.deaths;
                    stats.blue.thw += p.thw;
                    stats.blue.damageGiven += p.damageGiven;
                    stats.blue.damageRecvd += p.damageRecvd;
                    stats.blue.rail += p.weaponStats.Railgun != undefined ? p.weaponStats.Railgun.acc : 0;
                    stats.blue.lg += p.weaponStats["LightningGun:"] != undefined ? p.weaponStats["LightningGun:"].acc : 0;
                })

                stats.blue.rail = +stats.blue.rail / data.players.filter(a => a.team == "BLUE").length;
                stats.blue.lg = +stats.blue.lg / data.players.filter(a => a.team == "BLUE").length;

                textRed[0].value += "`" + `--Totals--` + `\n${stats.red.kills}/${stats.red.deaths}/${stats.red.thw}` + "`" + "\nDMG: " + "`" + `${(stats.red.damageGiven / 1000).toFixed(1)}/${(stats.red.damageRecvd / 1000).toFixed(1)}к` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${stats.red.rail.toFixed(0)}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${stats.red.lg.toFixed(0)}%` + "`" + `\n`;

                textBlue[0].value += "`" + `--Totals--` + `\n${stats.blue.kills}/${stats.blue.deaths}/${stats.blue.thw}` + "`" + "\nDMG: " + "`" + `${(stats.blue.damageGiven / 1000).toFixed(1)}/${(stats.blue.damageRecvd / 1000).toFixed(1)}к` + "`" + `\n<:rg:774071686239748106> ` + "`" + `${stats.blue.rail.toFixed(0)}%` + "`" + `\t<:lg:774071619319758858> ` + "`" + `${stats.blue.lg.toFixed(0)}%` + "`" + `\n`;

                let result = [textRed, textBlue];
                const embed = {
                    "description": `Map: ` + "`" + `${data.map}` + "`" + ` Date: ` + "`" + `${data.date}` + "`" + ` ID: ` + "`" + `${id.rows.length + 1}` + "`",
                    "color": randColor(),
                    "thumbnail": {
                        "url": `http://q3msk.ru/monitor/images/mapshots/Custom_Maps/Miscellaneous/${data.map}.jpg`
                    },
                    "fields": result
                }
                m.edit("", { embed: embed })
                pickups.forEach(async (s, ind) => {
                    if (s.play == true) {
                        s.games.push(data);
                        if (s.games.length > 0) {
                            let score = { red: 0, blue: 0 };
                            let winTeam = "";
                            let desc = "";
                            let playersMas = [];
                            s.games.forEach((g, ind) => {
                                console.log(g)
                                if (g.score.red > g.score.blue) {
                                    score.red += 1;
                                    desc += `${ind + 1}. Win: ` + "`" + `🔴 RED TEAM [${g.score.red} - ${g.score.blue}]` + "`" + ` Map: ` + "`" + `${g.map}` + "`" + ` Date: ` + "`" + `${g.date}` + "`\n";
                                } else {
                                    score.blue += 1;
                                    desc += `${ind + 1}. Win: ` + "`" + `🔵 BLUE TEAM [${g.score.red} - ${g.score.blue}]` + "`" + ` Map: ` + "`" + `${g.map}` + "`" + ` Date: ` + "`" + `${g.date}` + "`\n";
                                }
                                g.players.forEach(gp => {
                                    if (playersMas.find(a => a.nick == gp.nick) == undefined) {
                                        let obj = {
                                            nick: gp.nick,
                                            team: gp.team,
                                            kills: gp.kills,
                                            deaths: gp.deaths,
                                            thw: gp.thw,
                                            score: gp.score,
                                            dmg: gp.damageGiven
                                        }
                                        playersMas.push(obj);
                                    } else {
                                        playersMas.find(a => a.nick == gp.nick).kills += gp.kills;
                                        playersMas.find(a => a.nick == gp.nick).score += gp.score;
                                        playersMas.find(a => a.nick == gp.nick).dmg += gp.damageGiven;
                                        playersMas.find(a => a.nick == gp.nick).deaths += gp.deaths;
                                        playersMas.find(a => a.nick == gp.nick).thw += gp.thw;
                                    }
                                })
                            })
                            console.log(score);
                            if (score.red == 2 || score.blue == 2) {
                                playersMas.forEach(gp => {
                                    desc += `**${gp.nick}** - ` + "" + "`" + `${gp.score}(${gp.kills}/${gp.deaths}/${gp.thw})` + "`" + " DMG: " + "`" + `${(gp.dmg / (score.red + score.blue)).toFixed(0)}` + "`\n";
                                })
                                winTeam = score.red == 2 ? "🔴 RED" : "🔵 BLUE";
                                client.channels.cache.get('755686789414649906').send({
                                    embed: {
                                        "title": `${winTeam} TEAM WIN (${score.red} - ${score.blue})`,
                                        "description": desc,
                                        "color": randColor()
                                    }
                                })
                                setTimeout(() => {
                                    client.channels.cache.get('773451873876312104').send({
                                        embed: {
                                            "title": `${winTeam} TEAM WIN (${score.red} - ${score.blue})`,
                                            "description": desc,
                                            "color": randColor()
                                        }
                                    });
                                }, 2000)
                                s.players = [];
                                s.play = false;
                            }
                        }
                        client.channels.cache.get('773451873876312104').send({ embed: embed });
                    }
                })
                // m.edit("```" + `Score: 🔴 ${score.red} - ${score.blue} 🔵   Map: ${map}   Date: ${date}\n\n` + table + medals + "```");
            } catch (er) {
                console.log(er);
                m.edit(`Error: Bad stats file ;c`);
            }
        });

    }
});

client.login(`NDcyMTY5NjAyODgxNjgzNDY2.W1pMNQ.bAR3s6ObVHcDi8dgjAjyUhxDtmI`);

async function download(url) {
    const ppath = path.resolve(__dirname, `game.txt`);
    const writer = fs.createWriteStream(ppath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

function findTopDmg(nick, mode) {
    let allPlayers = [];
    let num = 4;
    let Mas = [];
    if (mode && mode == "3v3") num = 6;
    if (mode && mode == "4v4") num = 8;
    if (mode && mode == "5v5") num = 10;
    if (!mode) {
        Mas = All_games.filter(a => a.json.players.length > num);
    } else {
        Mas = All_games.filter(a => a.json.players.length == num);
    }
    Mas.forEach((f, ind) => {
        let data = f.json;
        let score = data.score.blue + data.score.red;
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            if (allPlayers.find((a) => a.nick == p.nick) != undefined) {
                if (allPlayers.find((a) => a.nick == p.nick).games >= 50) return;
                allPlayers.find((a) => a.nick == p.nick).damage.push(p.damageGiven);
                allPlayers.find((a) => a.nick == p.nick).games += 1;
                allPlayers.find((a) => a.nick == p.nick).score += score;
            } else {
                allPlayers.push({ score: score, games: 1, nick: p.nick, damage: [p.damageGiven] });
            }
        })
    })
    allPlayers = allPlayers.filter((a) => a.games >= 5);
    allPlayers.forEach((p, i) => {
        p.damageAll = 0;
        p.min = p.damage[0] ? p.damage[0] : 0;
        p.max = p.damage[0] ? p.damage[0] : 0;
        p.damage.filter(a => a > 0).forEach(d => {
            if (d > p.max) p.max = d;
            if (d < p.min) p.min = d;
            p.damageAll += d;
        })
        p.damageAVG = +`${(p.damageAll / p.damage.length).toFixed(1)}`
        p.damageAVGRound = +`${(p.damageAll / p.score).toFixed(1)}`
    })
    allPlayers = allPlayers.sort(function (a, b) {
        if (a.damageAVGRound > b.damageAVGRound) return -1;
        if (a.damageAVGRound == b.damageAVGRound) return 0;
        if (a.damageAVGRound < b.damageAVGRound) return 1;
    })

    return { id: allPlayers.findIndex((a) => a.nick == nick) + 1, min: allPlayers.find((a) => a.nick == nick) ? allPlayers.find((a) => a.nick == nick).min : 0, max: allPlayers.find((a) => a.nick == nick) ? allPlayers.find((a) => a.nick == nick).max : 0, damageAVGRound: allPlayers.find((a) => a.nick == nick) ? allPlayers.find((a) => a.nick == nick).damageAVGRound : 0, damageAVG: allPlayers.find((a) => a.nick == nick) ? allPlayers.find((a) => a.nick == nick).damageAVG : 0 };
}

function findTopElo(nick, mode) {
    let allPlayers = [];
    let num = 4;
    let Mas = [];
    if (mode && mode == "3v3") num = 6;
    if (mode && mode == "4v4") num = 8;
    if (mode && mode == "5v5") num = 10;
    if (!mode) {
        Mas = All_games.filter(a => a.json.players.length > num);
    } else {
        Mas = All_games.filter(a => a.json.players.length == num);
    }
    Mas.forEach((f, ind) => {
        let data = f.json;
        let score = data.score.blue + data.score.red;
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            if (allPlayers.find((a) => a.info.nick == p.nick) != undefined) {
                if (allPlayers.find((a) => a.info.nick == p.nick).games >= 50) return;
                allPlayers.find((a) => a.info.nick == p.nick).damage.push(p.damageGiven);
                allPlayers.find((a) => a.info.nick == p.nick).games += 1;
                allPlayers.find((a) => a.info.nick == p.nick).score += score;
                allPlayers.find((a) => a.info.nick == p.nick).info.kills += +p.kills;
                allPlayers.find((a) => a.info.nick == p.nick).info.deaths += +p.deaths;
                allPlayers.find((a) => a.info.nick == p.nick).thw += p.thw;
                allPlayers.find((a) => a.info.nick == p.nick).thwMas.push(p.thw);
                allPlayers.find((a) => a.info.nick == p.nick).elo += p.gameWin == true ? 15 : -15;
                allPlayers.find((a) => a.info.nick == p.nick).win += p.gameWin == true ? 1 : 0;
                allPlayers.find((a) => a.info.nick == p.nick).lose += p.gameWin == true ? 0 : 1;
            } else {
                allPlayers.push({ win: 0, lose: 0, thwMas: [p.thw], thw: p.thw, score: score, games: 1, elo: 1000, info: p, damage: [p.damageGiven] });
                allPlayers.find((a) => a.info.nick == p.nick).info.kills = p.kills;
                allPlayers.find((a) => a.info.nick == p.nick).info.deaths = p.deaths;
            }
        })
    })
    allPlayers = allPlayers.filter((a) => a.games >= 5);
    allPlayers.forEach((p, i) => {
        p.damageAll = 0;
        p.damage.filter(a => a > 0).forEach(d => {
            p.damageAll += d;
        })
        p.min = p.thwMas[0] ? p.thwMas[0] : 0;
        p.max = p.thwMas[0] ? p.thwMas[0] : 0;
        p.thwMas.forEach(d => {
            if (d > p.max) p.max = d;
            if (d < p.min) p.min = d;
        })
        p.damageAVG = +`${(p.damageAll / p.damage.length)}`;
        p.damageAVGRound = +`${(p.damageAll / p.score)}`;
        p.thwAVG = +`${(+p.thw / p.games)}`;
        p.eloAVG = +`${(((+p.damageAVGRound * 10) + +p.elo + (+p.thwAVG * 100)) / 3).toFixed(0)}`;
    })
    allPlayers = allPlayers.sort(function (a, b) {
        if (a.eloAVG > b.eloAVG) return -1;
        if (a.eloAVG == b.eloAVG) return 0;
        if (a.eloAVG < b.eloAVG) return 1;
    })
    return { info: allPlayers.find((a) => a.info.nick == nick) ? allPlayers.find((a) => a.info.nick == nick) : { min: 0, max: 0, win: 0, lose: 0, thwMas: [0], thw: 0, score: 0, thwAVG: 0, games: 1, elo: 1000, damage: [0] }, id: allPlayers.findIndex((a) => a.info.nick == nick) + 1, elo: allPlayers.find((a) => a.info.nick == nick) ? allPlayers.find((a) => a.info.nick == nick).eloAVG : 0 };
}

function findTopWeapons(weapons, nick) {
    let allPlayers = [];
    All_games.forEach((f, ind) => {
        let data = f.json;
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            for (we in p.weaponStats) {
                if (we == weapons) {
                    if (allPlayers.find((a) => a.nick == p.nick) != undefined) {
                        if (allPlayers.find((a) => a.nick == p.nick).games >= 50) return;
                        allPlayers.find((a) => a.nick == p.nick).hits += p.weaponStats[we] ? p.weaponStats[we].hits : 0;
                        allPlayers.find((a) => a.nick == p.nick).miss += p.weaponStats[we] ? p.weaponStats[we].miss : 0;
                        allPlayers.find((a) => a.nick == p.nick).deaths += p.weaponStats[we] ? p.weaponStats[we].deaths : 0;
                        allPlayers.find((a) => a.nick == p.nick).kills += p.weaponStats[we] ? p.weaponStats[we].kills : 0;
                        allPlayers.find((a) => a.nick == p.nick).games += 1;
                    } else {
                        allPlayers.push({ acc: 0, games: 1, nick: p.nick, kills: p.weaponStats[we] ? p.weaponStats[we].kills : 0, deaths: p.weaponStats[we] ? p.weaponStats[we].deaths : 0, hits: p.weaponStats[we] ? p.weaponStats[we].hits : 0, miss: p.weaponStats[we] ? p.weaponStats[we].miss : 0 });
                    }
                };
            }
        })
    })
    allPlayers.forEach((p, i) => {
        p.acc = `${((p.hits / p.miss) * 100).toFixed(0)}`
    })
    allPlayers = allPlayers.sort(function (a, b) {
        if (+a.acc > +b.acc) return -1;
        if (+a.acc == +b.acc) return 0;
        if (+a.acc < +b.acc) return 1;
    })
    let data = getWeapName(weapons);
    return { data: data, id: allPlayers.findIndex((a) => a.nick == nick) + 1, info: allPlayers[allPlayers.findIndex((a) => a.nick == nick)] != undefined ? allPlayers[allPlayers.findIndex((a) => a.nick == nick)] : 0 };
}

function listTopWeapons(weapons) {
    let allPlayers = [];
    All_games.forEach((f, ind) => {
        let data = f.json;
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            for (we in p.weaponStats) {
                if (we == weapons) {
                    if (allPlayers.find((a) => a.nick == p.nick) != undefined) {
                        if (allPlayers.find((a) => a.nick == p.nick).games >= 50) return;
                        allPlayers.find((a) => a.nick == p.nick).hits += p.weaponStats[we] ? p.weaponStats[we].hits : 0;
                        allPlayers.find((a) => a.nick == p.nick).miss += p.weaponStats[we] ? p.weaponStats[we].miss : 0;
                        allPlayers.find((a) => a.nick == p.nick).deaths += p.weaponStats[we] ? p.weaponStats[we].deaths : 0;
                        allPlayers.find((a) => a.nick == p.nick).kills += p.weaponStats[we] ? p.weaponStats[we].kills : 0;
                        allPlayers.find((a) => a.nick == p.nick).games += 1;
                    } else {
                        allPlayers.push({ acc: 0, games: 1, nick: p.nick, kills: p.weaponStats[we] ? p.weaponStats[we].kills : 0, deaths: p.weaponStats[we] ? p.weaponStats[we].deaths : 0, hits: p.weaponStats[we] ? p.weaponStats[we].hits : 0, miss: p.weaponStats[we] ? p.weaponStats[we].miss : 0 });
                    }
                };
            }
        })
    })
    allPlayers = allPlayers.filter((a) => a.games >= 5);
    allPlayers.forEach((p, i) => {
        p.acc = `${((p.hits / p.miss) * 100).toFixed(0)}`
    })
    allPlayers = allPlayers.sort(function (a, b) {
        if (+a.acc > +b.acc) return -1;
        if (+a.acc == +b.acc) return 0;
        if (+a.acc < +b.acc) return 1;
    })
    return allPlayers;
}

function listTopDmg() {
    let allPlayers = [];
    All_games.filter(a => a.json.players.length > 4).forEach((f, ind) => {
        let data = f.json;
        let score = data.score.blue + data.score.red;
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            if (allPlayers.find((a) => a.info.nick == p.nick) != undefined) {
                if (allPlayers.find((a) => a.info.nick == p.nick).games >= 50) return;
                allPlayers.find((a) => a.info.nick == p.nick).damage.push(p.damageGiven);
                allPlayers.find((a) => a.info.nick == p.nick).games += 1;
                allPlayers.find((a) => a.info.nick == p.nick).score += score;
                allPlayers.find((a) => a.info.nick == p.nick).info.kills += p.kills;
                allPlayers.find((a) => a.info.nick == p.nick).info.deaths += p.deaths;
                allPlayers.find((a) => a.info.nick == p.nick).info.thw += p.thw;
            } else {
                allPlayers.push({ score: score, games: 1, info: p, damage: [p.damageGiven] });
            }
        })
    })
    allPlayers = allPlayers.filter((a) => a.games >= 5);
    allPlayers.forEach((p, i) => {
        p.damageAll = 0;
        p.damage.filter(a => a > 0).forEach(d => {
            p.damageAll += d;
        })
        p.damageAVG = `${(p.damageAll / p.damage.length).toFixed(1)}`
        p.damageAVGRound = `${(p.damageAll / p.score).toFixed(1)}`
    })
    allPlayers = allPlayers.sort(function (a, b) {
        if (a.damageAVGRound > b.damageAVGRound) return -1;
        if (a.damageAVGRound == b.damageAVGRound) return 0;
        if (a.damageAVGRound < b.damageAVGRound) return 1;
    })
    return allPlayers;
}

function listTopElo() {
    let allPlayers = [];
    All_games.filter(a => a.json.players.length > 4).forEach((f, ind) => {
        let data = f.json;
        let score = data.score.blue + data.score.red;
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            if (allPlayers.find((a) => a.info.nick == p.nick) != undefined) {
                if (allPlayers.find((a) => a.info.nick == p.nick).games >= 50) return;
                allPlayers.find((a) => a.info.nick == p.nick).damage.push(p.damageGiven);
                allPlayers.find((a) => a.info.nick == p.nick).games += 1;
                allPlayers.find((a) => a.info.nick == p.nick).score += score;
                allPlayers.find((a) => a.info.nick == p.nick).info.kills += +p.kills;
                allPlayers.find((a) => a.info.nick == p.nick).info.deaths += +p.deaths;
                allPlayers.find((a) => a.info.nick == p.nick).thw += p.thw;
                allPlayers.find((a) => a.info.nick == p.nick).elo += p.gameWin == true ? 15 : -15;
            } else {
                allPlayers.push({ thw: p.thw, score: score, games: 1, elo: 1000, info: p, damage: [p.damageGiven] });
                allPlayers.find((a) => a.info.nick == p.nick).info.kills = p.kills;
                allPlayers.find((a) => a.info.nick == p.nick).info.deaths = p.deaths;
            }
        })
    })
    allPlayers = allPlayers.filter((a) => a.games >= 5);
    allPlayers.forEach((p, i) => {
        p.damageAll = 0;
        p.damage.filter(a => a > 0).forEach(d => {
            p.damageAll += d;
        })
        p.damageAVG = +`${(p.damageAll / p.damage.length)}`
        p.damageAVGRound = +`${(p.damageAll / p.score)}`
        p.thwAVG = +`${(+p.thw / p.games)}`
        p.eloAVG = +`${(((+p.damageAVGRound * 10) + +p.elo + (+p.thwAVG * 100)) / 3).toFixed(0)}`
    })
    allPlayers = allPlayers.sort(function (a, b) {
        if (a.eloAVG > b.eloAVG) return -1;
        if (a.eloAVG == b.eloAVG) return 0;
        if (a.eloAVG < b.eloAVG) return 1;
    })
    return allPlayers;
}

function getRecent() {
    let allPlayers = [];
    All_games.filter(a => a.json.players.length > 4).forEach((f, ind) => {
        let data = f.json;
        let score = data.score.blue + data.score.red;
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            if (allPlayers.find((a) => a.info.nick == p.nick) != undefined) {
                allPlayers.find((a) => a.info.nick == p.nick).damage.push(p.damageGiven);
                allPlayers.find((a) => a.info.nick == p.nick).games += 1;
                allPlayers.find((a) => a.info.nick == p.nick).gamesMass.push({ data: data, id: f.id });
                allPlayers.find((a) => a.info.nick == p.nick).score += score;
                allPlayers.find((a) => a.info.nick == p.nick).info.kills += p.kills;
                allPlayers.find((a) => a.info.nick == p.nick).info.deaths += p.deaths;
                allPlayers.find((a) => a.info.nick == p.nick).thw += p.thw;
                allPlayers.find((a) => a.info.nick == p.nick).elo += p.gameWin == true ? 15 : -15;
            } else {
                allPlayers.push({ thw: p.thw, score: score, games: 1, gamesMass: [{ data: data, id: f.id }], elo: 1000, info: p, damage: [p.damageGiven] });
            }
        })
    })
    allPlayers.forEach((p, i) => {
        p.damageAll = 0;
        p.damage.filter(a => a > 0).forEach(d => {
            p.damageAll += d;
        })
        p.damageAVG = +`${(p.damageAll / p.damage.length)}`
        p.damageAVGRound = +`${(p.damageAll / p.score)}`
        p.thwAVG = +`${(+p.info.thw / p.games)}`
        p.eloAVG = +`${(((+p.damageAVGRound * 10) + +p.elo + (+p.thwAVG * 100)) / 3).toFixed(0)}`
    })
    allPlayers = allPlayers.sort(function (a, b) {
        if (a.eloAVG > b.eloAVG) return -1;
        if (a.eloAVG == b.eloAVG) return 0;
        if (a.eloAVG < b.eloAVG) return 1;
    })
    return allPlayers;
}

function dateSort(a, b) {
    if (+a.split(".json").join("") > +b.split(".json").join("")) return -1;
    if (+a.split(".json").join("") == +b.split(".json").join("")) return 0;
    if (+a.split(".json").join("") < +b.split(".json").join("")) return 1;
}

function getWeapName(cmd) {
    let weap = { name: "-", icon: "-" };
    if (cmd == "mg" || cmd == "MachineGun") {
        weap.name = "MachineGun";
        weap.icon = "<:mg:774071477002960937>";
    }
    if (cmd == "sg" || cmd == "Shotgun") {
        weap.name = "Shotgun";
        weap.icon = "<:sg:774071502781808670>";
    }
    if (cmd == "gl" || cmd == "G.Launcher") {
        weap.name = "G.Launcher";
        weap.icon = "<:gl:774071542287564810>";
    }
    if (cmd == "rl" || cmd == "R.Launcher") {
        weap.name = "R.Launcher";
        weap.icon = "<:rl:774071573510488065>";
    }
    if (cmd == "lg" || cmd == "LightningGun:") {
        weap.name = "LightningGun:";
        weap.icon = "<:lg:774071619319758858>";
    }
    if (cmd == "rg" || cmd == "Railgun") {
        weap.name = "Railgun";
        weap.icon = "<:rg:774071686239748106>";
    }
    if (cmd == "pg" || cmd == "Plasmagun") {
        weap.name = "Plasmagun";
        weap.icon = "<:pg:774071712454672407>";
    }
    return weap
}

function findBest(players, best) {
    if (best == "damage") {
        let t = players.sort(function (a, b) {
            if (a.damageGiven > b.damageGiven) return -1;
            if (a.damageGiven == b.damageGiven) return 0;
            if (a.damageGiven < b.damageGiven) return 1;
        })
        return t[0];
    }
    if (best == "Mega") {
        players.forEach(p => {
            if (p.healthTaken.indexOf("MH") > -1) {
                p.mega = +p.healthTaken.split("(")[1].split(" MH")[0];
            }
        })
        let t = players.sort(function (a, b) {
            if (a.mega > b.mega) return -1;
            if (a.mega == b.mega) return 0;
            if (a.mega < b.mega) return 1;
        })
        return t[0];
    }
    if (best == "Red") {
        players.forEach(p => {
            if (p.armorTaken.indexOf("RA") > -1) {
                if (p.armorTaken.indexOf("YA") > -1) {
                    p.red = +p.armorTaken.split(", ")[1].split(" RA")[0];
                } else {
                    p.red = +p.armorTaken.split("(")[1].split(" RA")[0];
                }
            }
        })
        let t = players.sort(function (a, b) {
            if (a.red > b.red) return -1;
            if (a.red == b.red) return 0;
            if (a.red < b.red) return 1;
        })
        return t[0];
    }
    if (best == "Wanker") {
        let t = players.sort(function (a, b) {
            if (a.damageRecvd > b.damageRecvd) return -1;
            if (a.damageRecvd == b.damageRecvd) return 0;
            if (a.damageRecvd < b.damageRecvd) return 1;
        })
        return t[0];
    }
    if (best == "RailGun") {
        let t = players.sort(function (a, b) {
            if (a.weaponStats.Railgun.acc > b.weaponStats.Railgun.acc) return -1;
            if (a.weaponStats.Railgun.acc == b.weaponStats.Railgun.acc) return 0;
            if (a.weaponStats.Railgun.acc < b.weaponStats.Railgun.acc) return 1;
        })
        return t[0];
    }
    if (best == "LightingGun") {
        let t = players.sort(function (a, b) {
            if (a.weaponStats["LightningGun:"].acc > b.weaponStats["LightningGun:"].acc) return -1;
            if (a.weaponStats["LightningGun:"].acc == b.weaponStats["LightningGun:"].acc) return 0;
            if (a.weaponStats["LightningGun:"].acc < b.weaponStats["LightningGun:"].acc) return 1;
        })
        return t[0];
    }
    if (best == "Priest") {
        let t = players.sort(function (a, b) {
            if (a.thw > b.thw) return -1;
            if (a.thw == b.thw) return 0;
            if (a.thw < b.thw) return 1;
        })
        return t[0];
    }
}

function randColor() {
    let colors = [1752220, 3066993, 3447003, 10181046, 15844367, 15105570, 15158332, 9807270, 8359053, 3426654, 1146986, 2067276, 2123412, 7419530, 12745742, 11027200, 10038562, 9936031, 12370112, 2899536, 16580705, 12320855];
    let num = randomInteger(0, colors.length - 1);
    return colors[num];
}

function randomInteger(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

async function addGames(data) {
    const id = await bd.query(`SELECT * FROM "matches" `);
    const check = await bd.query(`SELECT * FROM "matches" WHERE date = $1`, [data.date]);
    if (check.rows.length == 0) {
        const res = await bd.query('INSERT INTO matches(id, score_red, score_blue, date, map, json) VALUES($1, $2, $3, $4, $5, $6) RETURNING *', [id.rows.length + 1, data.score.red, data.score.blue, data.date, data.map, data])
    }
    let temp = await bd.query(`SELECT * FROM "public"."matches" ORDER BY "id" DESC`);
    All_games = temp.rows;
    refreshProfiles();
}

function refreshProfiles() {
    bd.query('SELECT * FROM "public"."matches" ORDER BY "id"', (err, res) => {
        if (err) return console.log(err.stack);
        let ind = 0;
        let row = res.rows;
        cicle();
        function cicle() {
            if (ind == row.length - 1) return console.log("Base refreshed!");
            let data = row[ind].json.players;
            let i = 0;

            ciclePlayers();

            function ciclePlayers() {
                refreshPlayer(data[i], row[ind].id).then(res => {
                    i++;
                    if (i == data.length - 1) {
                        ind++;
                        cicle();
                        return
                    }
                    ciclePlayers();
                });
            }
        }
    })
}

async function refreshPlayer(p, id) {
    try {
        const idefic = await bd.query(`SELECT * FROM "players"`)
        let all_id = idefic.rows.length;
        const res = await bd.query(`SELECT * FROM "players" WHERE nick = $1`, [p.nick])
        if (res.rows.length == 0) {
            let t = {
                nick: "",
                kills: 0,
                deaths: 0,
                thw: 0,
                win: 0,
                score: 0,
                lose: 0,
                elo: 1000,
                damage: {
                    game: 0,
                    round: 0,
                    all: 0
                },
                matches: [id],
                "weaponStats": {
                    "MachineGun": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "Shotgun": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "G.Launcher": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "R.Launcher": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "LightningGun:": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "Railgun": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    },
                    "Plasmagun": {
                        "hits": 0,
                        "miss": 0,
                        "kills": 0,
                        "deaths": 0,
                        "acc": 0
                    }
                }
            };
            t.nick = p.nick;
            t.kills += p.kills;
            t.deaths += p.deaths;
            t.thw += p.thw;
            t.win += p.gameWin == true ? 1 : 0;
            t.lose += p.gameWin == false ? 1 : 0;
            t.damage.all += p.damageGiven;
            for (key in t.weaponStats) {
                if (!p.weaponStats[key] || key == "MachineGun") continue;
                t.weaponStats[key].hits += p.weaponStats[key].hits;
                t.weaponStats[key].miss += p.weaponStats[key].miss;
                t.weaponStats[key].kills += p.weaponStats[key].kills;
                t.weaponStats[key].deaths += p.weaponStats[key].deaths;
                t.weaponStats[key].acc = +((+t.weaponStats[key].hits / +t.weaponStats[key].miss) * 100).toFixed(1);
            }
            const value = [t.nick, "", 0, "", t.elo, 0, 0, t.damage.all, t.win, t.lose, t.kills, t.deaths, t.thw, t.matches.toString(), t.weaponStats, all_id, "", "", {}];
            const result = await bd.query('INSERT INTO players(nick, discord_nick, discord_id, telegram, elo, damage_game, damage_round, damage_all, win, lose, kills, deaths, thw, matches, weapons, id, sign, skill, top) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *', value);
            return "Ready";
        } else {
            let d = res.rows[0];
            if (d.matches.toString().indexOf(id.toString()) > -1) return;
            let t = {
                nick: d.nick,
                kills: +d.kills,
                deaths: +d.deaths,
                thw: +d.thw,
                win: +d.win,
                lose: +d.lose,
                elo: d.elo,
                damage: {
                    game: +d.damage_game,
                    round: +d.damage_round,
                    all: +d.damage_all
                },
                matches: d.matches.toString().split(","),
                "weaponStats": d.weapons
            };
            t.matches.push(id);
            t.kills += p.kills;
            t.deaths += p.deaths;
            t.thw += p.thw;
            t.win += p.gameWin == true ? 1 : 0;
            t.lose += p.gameWin == false ? 1 : 0;
            t.damage.all += p.damageGiven;
            for (key in t.weaponStats) {
                if (!p.weaponStats[key]) continue;
                t.weaponStats[key].hits += p.weaponStats[key].hits;
                t.weaponStats[key].miss += p.weaponStats[key].miss;
                t.weaponStats[key].kills += p.weaponStats[key].kills;
                t.weaponStats[key].deaths += p.weaponStats[key].deaths;
                t.weaponStats[key].acc = +((+t.weaponStats[key].hits / +t.weaponStats[key].miss) * 100).toFixed(1);
            }
            const value = [t.nick, "", "", t.damage.all, t.win, t.lose, t.kills, t.deaths, t.thw, t.matches.toString(), t.weaponStats, d.id, "", "", {}];
            const result = await bd.query('UPDATE players SET(nick, discord_nick, telegram, damage_all, win, lose, kills, deaths, thw, matches, weapons, id, sign, skill, top) = ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) WHERE nick = $1', value);
            // console.log(result.rows[0])
            return "Ready"
        }
    } catch (err) {
        console.log(err.stack)
    }
}

async function register(discord_id, nick) {
    const idefic = await bd.query(`SELECT * FROM "players"`)
    let all_id = idefic.rows.length;
    const res = await bd.query(`SELECT * FROM "players" WHERE discord_id = $1`, [discord_id])
    if (res.rows.length == 0) {
        let t = {
            nick: nick,
            kills: 0,
            deaths: 0,
            thw: 0,
            win: 0,
            score: 0,
            lose: 0,
            elo: 1000,
            damage: {
                game: 0,
                round: 0,
                all: 0
            },
            matches: [],
            "weaponStats": {
                "MachineGun": {
                    "hits": 0,
                    "miss": 0,
                    "kills": 0,
                    "deaths": 0,
                    "acc": 0
                },
                "Shotgun": {
                    "hits": 0,
                    "miss": 0,
                    "kills": 0,
                    "deaths": 0,
                    "acc": 0
                },
                "G.Launcher": {
                    "hits": 0,
                    "miss": 0,
                    "kills": 0,
                    "deaths": 0,
                    "acc": 0
                },
                "R.Launcher": {
                    "hits": 0,
                    "miss": 0,
                    "kills": 0,
                    "deaths": 0,
                    "acc": 0
                },
                "LightningGun:": {
                    "hits": 0,
                    "miss": 0,
                    "kills": 0,
                    "deaths": 0,
                    "acc": 0
                },
                "Railgun": {
                    "hits": 0,
                    "miss": 0,
                    "kills": 0,
                    "deaths": 0,
                    "acc": 0
                },
                "Plasmagun": {
                    "hits": 0,
                    "miss": 0,
                    "kills": 0,
                    "deaths": 0,
                    "acc": 0
                }
            }
        };
        const value = [t.nick, "", discord_id, "", t.elo, 0, 0, t.damage.all, t.win, t.lose, t.kills, t.deaths, t.thw, t.matches.toString(), t.weaponStats, all_id, "", "", {}];
        const result = await bd.query('INSERT INTO players(nick, discord_nick, discord_id, telegram, elo, damage_game, damage_round, damage_all, win, lose, kills, deaths, thw, matches, weapons, id, sign, skill, top) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *', value);
        return "Ready";
    }
}

function startPickup(p, ind) {
    const pickup = [client.channels.cache.get("773528610043723797"), client.channels.cache.get("773998892463292436"), client.channels.cache.get("773507161778814976"), client.channels.cache.get("773515480782602271"), client.channels.cache.get("773515517365059614")];
    const textChannel = client.channels.cache.get('755686789414649906');
    if (p.players.length == 0 && p.play == true) return;

    let red = [];
    let blue = [];

    let map = p.maps[randomInteger(0, p.maps.length - 1)];

    p.players.sort((a, b) => +a.elo - +b.elo).reverse().forEach((s) => {
        if (arraySum(red) < arraySum(blue)) {
            if (red.find(a => a.nick == s.nick) == undefined) red.push(s);
        } else {
            if (blue.find(a => a.nick == s.nick) == undefined) blue.push(s);
        }
    })

    p.players = [];

    function arraySum(array) {
        var sum = 0;
        for (var i = 0; i < array.length; i++) {
            sum += +array[i].elo;
        }
        return sum;
    }

    let textRed = [{
        name: `[${arraySum(red)}] Red Team 🔴`,
        value: "",
        inline: true
    }];

    let textBlue = [{
        name: `[${arraySum(blue)}] Blue Team 🔵`,
        value: "",
        inline: true
    }];

    red.forEach((p, ind) => {
        textRed[0].value += `\n[${p.elo}] <@!${p.discord_id}>`;
    })

    blue.forEach((p, ind) => {
        textBlue[0].value += `\n[${p.elo}] <@!${p.discord_id}>`;
    })

    let result = [textRed, textBlue];
    const embed = {
        "description": `Map: ` + "`" + `${map}` + "`" + ` Server: ` + "`" + `${p.server}` + "`" + `\n` + "`" + `/connect ${p.server}` + "`" + `\nДо двух побед (**BO3**)\nПроигравшие выбирают следующую карту`,
        "image": {
            "url": `http://q3msk.ru/monitor/images/mapshots/Custom_Maps/Miscellaneous/${map}.jpg`
        },
        "color": randColor(),
        "fields": result
    }
    textChannel.send(`https://discord.gg/hW3U96WjKN https://discord.gg/PDbxjSjZjV`, { embed: embed });
    pickups.forEach(async (s, ind) => {
        if (p.mode != s.mode) { s.players = []; } else {
            s.play = true;
            pickup[ind].join().then(connection => {
                // console.log("Joined voice channel!");

                const dispatcher = connection.play(require("path").join(__dirname, './test.mp3'));

                dispatcher.on('start', () => { //not working
                    dispatcher.setVolume(1);
                    // console.log("Playing");
                });

                dispatcher.on('error', (err) => console.log(err)); //no errors

                dispatcher.on('finish', end => { //working fine
                    // console.log("Finished");
                    // console.log("End: " + end);
                    // pickup[ind].leave()
                })
            }).catch(err => console.log(err));
        };
    })
    const history = client.channels.cache.get('773451873876312104');
    if (history) history.send({ embed: embed });
}

