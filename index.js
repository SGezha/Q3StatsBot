const Discord = require("discord.js"),
    fs = require('fs'),
    path = require('path'),
    axios = require('axios'),
    client = new Discord.Client(),
    TelegramBot = require('node-telegram-bot-api'),
    discordChat = [],
    bans = "lagz-sr"
    bot = new TelegramBot(`1278792395:AAHk8mFilPMfV70UQXg4RNGXwxdZxBgbyQ4`, { polling: true });
    admins = "149521299562037249";

let asTable = require('as-table').configure({ delimiter: ' | ' }), id = 0, who = "";

if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
    id = fs.readdirSync("data").length / 2 > 0 ? fs.readdirSync("data").length / 2 : 0;
}

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
            if (cmd == "dmg") {
                let list = listTopDmg();
                let info = [
                    ["#", "Player", "K/D/A", "DMG Game", "DMG Round"],
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
                ["#", "Player", "K/D/A", "DMG Game", "DMG Round"],
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
            bot.sendMessage(msg.chat.id, fs.readFileSync(`data/${+m[1] - 1}.txt`).toString(), { parse_mode: "Markdown" });
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
                    if (bans.indexOf(p.nick) > -1) {
                        return bot.sendMessage(msg.chat.id, `${p.nick} - player in inactive :c`)
                    }
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
client.on("ready", () => {
    console.log(`Bot has started.`);
    client.user.setActivity(`Author: SGezha`);
});

client.on("message", async message => {
    if (message.author.username == "Pubobot" && message.content.indexOf("[") > -1) {
        who = message.content;
    }
    discordChat.push({ nick: message.author.username, text: message.content });
    if (message.author.bot) return;
    let command = message.content.split(" ")[0];

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

    if (command === "/ping") {
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms.`);
    }

    if (command === "/profile" || command === "/p") {
        if (message.content.split(" ")[1]) {
            let nick = message.content.split(" ")[1].toLowerCase();
            const m = await message.channel.send(`Loading profile for ${message.content.split(" ")[1]}...`);
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
                    if (p.nick.toLowerCase().indexOf(nick) > -1) {
                        if (bans.indexOf(p.nick) > -1) {
                            return m.edit(`${p.nick} - player in inactive :c`)
                        }
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
            if (profile.nick == "") return m.edit(`Error: cant find player.`)
            if ((profile.lose + profile.win) < 10) return m.edit(`Error: You need play 5 calibration games.`);
            let weaponsStatsText = [];
            for (we in profile.weaponStats) {
                if(+profile.weaponStats[we].acc > 0) {
                    weaponsStatsText.push({
                        name: `${getWeapName(we).icon} ${we.split(":").join("")}`,
                        value: `<:accuracy:700042427876114522> ` + "`" + `${profile.weaponStats[we].acc}%` + "`" + ` **[#${findTopWeapons(we, profile.nick).id}]** \n**Hits: ` + "`" + `${profile.weaponStats[we].hits}` + "`" + `\tShots: ` + "`" + `${profile.weaponStats[we].miss}` + "`\nKills: " + "`" + `${profile.weaponStats[we].kills}` + "`" + `\tDeaths: ` + "`" + `${profile.weaponStats[we].deaths}` + "`" + `**`,
                        inline: true
                    })   
                }
            }
            const embed = {
                "title": `:crossed_swords: **${profile.nick}**`,
                "description": `**WinRate: ` + "`" + `${((profile.win / (profile.lose + profile.win)) * 100).toFixed(0)}% (${profile.win} - ${profile.lose})` + "`" + `
                KDU: ` + "`" + `${profile.kills}/${profile.deaths}/${profile.thw}` + "`" + `
                DMG Round: ` + "`" + `${findTopDmg(profile.nick).damageAVGRound}` + "`" + ` [#${findTopDmg(profile.nick).id}]
                DMG Game: ` + "`" + `${findTopDmg(profile.nick).damageAVG}` + "`" + `\n**`,
                "color": 12916672,
                "fields": weaponsStatsText
            }
            m.edit(`Result for: ${profile.nick}`,{ embed: embed })
        } else {
            message.channel.send(`Please type nick. Example "/profile asuna"`)
        }
    }

    if (command === "/help") {
        message.channel.send(`
        /stats (s) [id] - отобразить статистику игры 
/profile (p) [nick] - профиль игрока
/history (h) - история игр
/ping - pong
/top (t) [dmg/mg/sg/gl/rl/lg/rg/pg] - лидерборд по оружию/дамагу
        `);
    }

    if (command === "/history" || command === "/h") {
        let page = message.content.split(" ")[1] != undefined ? +message.content.split(" ")[1] - 1 : 0;
        let info = [
            ["ID", "DATE", "MAP", "SCORE"],
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
        message.channel.send(`Games history [${page + 1}/${numPage}]:` + "```" + result + "```");
    }

    if (command === "/top" || command === "/t") {
        let cmd = message.content.split(" ")[1];
        let page = message.content.split(" ")[2] != undefined ? +message.content.split(" ")[2] - 1 : 0;
        if (cmd) {
            if (cmd == "dmg") {
                let list = listTopDmg();
                let info = [
                    ["#", "Player", "K/D/A", "DMG Game", "DMG Round"],
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

                message.channel.send(`Top players (DamageAVG) [${page + 1}/${numPage == 0 ? 1 : numPage}]:\n` + "```" + result + "```")
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

                message.channel.send(`${weap.icon} Top players (${weap.name.split(":").join("")}) [${page + 1}/${numPage == 0 ? 1 : numPage}]:\n` + "```" + result + "```")
            }
        } else {
            let list = listTopDmg();
            let info = [
                ["#", "Player", "K/D/A", "DMG Game", "DMG Round"],
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

            message.channel.send(`Top players (DamageAVG) [${page + 1}/${numPage == 0 ? 1 : numPage}]:\n` + "```" + result + "```")
        }
    }


    if (command === "/stats" || command === "/s") {
        if (message.content.split(" ")[1] != undefined) {
            message.channel.send(fs.readFileSync(`data/${+message.content.split(" ")[1] - 1}.txt`).toString());
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

                let stats = data.split("Map: ")[0].split("Accuracy info for: ");

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

                let dataIds = [];
                fs.readdirSync("data").filter((a) => a.indexOf(".json") > -1).sort(dateSort).forEach((f, ind) => {
                    let info = JSON.parse(fs.readFileSync(`data/${f}`).toString());
                    dataIds.push(info.date);
                })

                if (dataIds.toString().indexOf(date) > -1) return m.edit(`Error: already have ;c`);

                let players = [];

                console.log(`Parsing game - ${map} ${date}`);

                stats.forEach((p, ind) => {
                    if (ind == 0 || p.indexOf("No weapon info available.") > -1) return;

                    // players stats
                    let obj = { nick: p.split("\r")[0], kills: 0, deaths: 0, thw: 0, sui: 0, win: 0, eff: 0, score: 0 };
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

                    obj.damageGiven = +p.split("Damage Given: ")[1].split(" ")[0];
                    obj.damageRecvd = +p.split("Damage Recvd: ")[1].split(" ")[0];
                    obj.armorTaken = p.split("Armor Taken : ")[1].split("\r")[0];
                    obj.healthTaken = p.split("Health Taken: ")[1].split("\r")[0];

                    // weapons stats
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

                    players.push(obj);
                })

                //discord message
                let jsonBlue = [
                    ["Player", "K/D/A", "DG/DR", "LG/RG", "Score"],
                    ["-------", "-------", "-------", "-------", "-------"]
                ];

                let jsonRed = [
                    ["Player", "K/D/A", "DG/DR", "LG/RG", "Score"],
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
                        jsonRed.push([`${p.nick}`, `${p.kills}/${p.deaths}/${p.thw}`, `${p.damageGiven}/${p.damageRecvd}`, `${p.weaponStats["LightningGun:"].acc}%/${p.weaponStats["Railgun"].acc}%`, `${p.score}`]);
                    } else {
                        totalBlue.kills += p.kills;
                        totalBlue.deaths += p.deaths;
                        totalBlue.thw += p.thw;
                        totalBlue.damageGiven += p.damageGiven;
                        totalBlue.damageRecvd += p.damageRecvd;
                        totalBlue.score += p.score;
                        jsonBlue.push([`${p.nick}`, `${p.kills}/${p.deaths}/${p.thw}`, `${p.damageGiven}/${p.damageRecvd}`, `${p.weaponStats["LightningGun:"].acc}%/${p.weaponStats["Railgun"].acc}%`, `${p.score}`]);
                    }
                })

                jsonRed.push(["-------", "-------", "-------", "-------", "-------"]);
                jsonBlue.push(["-------", "-------", "-------", "-------", "-------"]);

                jsonRed.push([`${totalRed.nick}`, `${totalRed.kills}/${totalRed.deaths}/${totalRed.thw}`, `${totalRed.damageGiven}/${totalRed.damageRecvd}`, ``, `${totalRed.score}`]);

                jsonBlue.push([`${totalBlue.nick}`, `${totalBlue.kills}/${totalBlue.deaths}/${totalBlue.thw}`, `${totalBlue.damageGiven}/${totalBlue.damageRecvd}`, ``, `${totalBlue.score}`]);


                let resultRed = asTable(jsonRed);
                let resultBlue = asTable(jsonBlue);

                let best = {
                    damage() {
                        let t = players.sort(function (a, b) {
                            if (a.damageGiven > b.damageGiven) return -1;
                            if (a.damageGiven == b.damageGiven) return 0;
                            if (a.damageGiven < b.damageGiven) return 1;
                        })
                        return t[0];
                    },
                    Wanker() {
                        let t = players.sort(function (a, b) {
                            if (a.damageRecvd > b.damageRecvd) return -1;
                            if (a.damageRecvd == b.damageRecvd) return 0;
                            if (a.damageRecvd < b.damageRecvd) return 1;
                        })
                        return t[0];
                    },
                    RailGun() {
                        let t = players.sort(function (a, b) {
                            if (a.weaponStats.Railgun.acc > b.weaponStats.Railgun.acc) return -1;
                            if (a.weaponStats.Railgun.acc == b.weaponStats.Railgun.acc) return 0;
                            if (a.weaponStats.Railgun.acc < b.weaponStats.Railgun.acc) return 1;
                        })
                        return t[0];
                    },
                    LightingGun() {
                        let t = players.sort(function (a, b) {
                            if (a.weaponStats["LightningGun:"].acc > b.weaponStats["LightningGun:"].acc) return -1;
                            if (a.weaponStats["LightningGun:"].acc == b.weaponStats["LightningGun:"].acc) return 0;
                            if (a.weaponStats["LightningGun:"].acc < b.weaponStats["LightningGun:"].acc) return 1;
                        })
                        return t[0];
                    },
                    Priest() {
                        let t = players.sort(function (a, b) {
                            if (a.thw > b.thw) return -1;
                            if (a.thw == b.thw) return 0;
                            if (a.thw < b.thw) return 1;
                        })
                        return t[0];
                    }
                }


                table = `🔴 RED TEAM\n${resultRed}\n\n🔵 BLUE TEAM\n${resultBlue}`;
                let medals = `\n\n💥 Berserk: ${best.damage().nick} - ${best.damage().damageGiven}\n🙏 Priest: ${best.Priest().nick} - ${best.Priest().thw} \n🤷‍♂️ Wanker: ${best.Wanker().nick} - ${best.Wanker().damageRecvd}\n🎯 Best RailGun: ${best.RailGun().nick} - ${best.RailGun().weaponStats.Railgun.acc}% (${best.RailGun().weaponStats.Railgun.hits}/${best.RailGun().weaponStats.Railgun.miss}) \n⚡ Best LightingGun: ${best.LightingGun().nick} - ${best.LightingGun().weaponStats["LightningGun:"].acc}% (${best.LightingGun().weaponStats["LightningGun:"].hits}/${best.LightingGun().weaponStats["LightningGun:"].miss})`;

                id = fs.readdirSync("data").length / 2 > 0 ? fs.readdirSync("data").length / 2 : 0;

                fs.writeFileSync(`data/${id}.txt`, "```" + `Score: 🔴 ${score.red} - ${score.blue} 🔵   Map: ${map}   Date: ${date}\n\n` + table + medals + "```");
                fs.writeFileSync(`data/${id}.json`, JSON.stringify({ score: score, date: date, map: map, players: players }));

                m.edit("```" + `Score: 🔴 ${score.red} - ${score.blue} 🔵   Map: ${map}   Date: ${date}\n\n` + table + medals + "```");
            } catch (er) {
                m.edit(`Error: Bad stats file ;c`);
            }
        });

    }
});

client.login(`NDcyMTY5NjAyODgxNjgzNDY2.W1pMNQ.QQPmWbkREqBy9TqFQl7FWgEzDMg`);

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

function findTopDmg(nick) {
    let allPlayers = [];
    fs.readdirSync("data").filter((a) => a.indexOf(".json") > -1).sort(dateSort).forEach((f, ind) => {
        let data = JSON.parse(fs.readFileSync(`data/${f}`).toString());
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
    allPlayers.forEach((p, i) => {
        p.damageAll = 0;
        p.damage.forEach(d => {
            p.damageAll += d;
        })
        p.damageAVG = `${(p.damageAll / p.damage.length).toFixed(0)}`
        p.damageAVGRound = `${(p.damageAll / p.score).toFixed(0)}`
    })
    allPlayers = allPlayers.filter((a) => a.games >= 5);
    allPlayers = allPlayers.sort(function (a, b) {
        if (a.damageAVGRound > b.damageAVGRound) return -1;
        if (a.damageAVGRound == b.damageAVGRound) return 0;
        if (a.damageAVGRound < b.damageAVGRound) return 1;
    })

    return { id: allPlayers.findIndex((a) => a.nick == nick) + 1, damageAVGRound: allPlayers.find((a) => a.nick == nick).damageAVGRound, damageAVG: allPlayers.find((a) => a.nick == nick).damageAVG };
}

function findTopWeapons(weapons, nick) {
    let allPlayers = [];
    fs.readdirSync("data").filter((a) => a.indexOf(".json") > -1).sort(dateSort).forEach((f, ind) => {
        let data = JSON.parse(fs.readFileSync(`data/${f}`).toString());
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            if (p.weaponStats[weapons]) {
                if (allPlayers.find((a) => a.nick == p.nick) != undefined) {
                    if (allPlayers.find((a) => a.nick == p.nick).games >= 50) return;
                    allPlayers.find((a) => a.nick == p.nick).hits += (p.weaponStats[weapons].hits);
                    allPlayers.find((a) => a.nick == p.nick).miss += (p.weaponStats[weapons].miss);
                    allPlayers.find((a) => a.nick == p.nick).games += 1;
                } else {
                    allPlayers.push({ acc: 0, games: 1, nick: p.nick, hits: p.weaponStats[weapons].hits ? p.weaponStats[weapons].hits : 0, miss: p.weaponStats[weapons].miss ? p.weaponStats[weapons].miss : 0 });
                }
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

    return { id: allPlayers.findIndex((a) => a.nick == nick) + 1, acc: allPlayers[allPlayers.findIndex((a) => a.nick == nick)] != undefined ? allPlayers[allPlayers.findIndex((a) => a.nick == nick)].acc : 0};
}

function listTopWeapons(weapons) {
    let allPlayers = [];
    fs.readdirSync("data").filter((a) => a.indexOf(".json") > -1).sort(dateSort).forEach((f, ind) => {
        let data = JSON.parse(fs.readFileSync(`data/${f}`).toString());
        data.players.forEach((p, i) => {
            if (bans.indexOf(p.nick) > -1) return;
            if (p.weaponStats[weapons]) {
                if (allPlayers.find((a) => a.info.nick == p.nick) != undefined) {
                    if (allPlayers.find((a) => a.info.nick == p.nick).games >= 50) return;
                    allPlayers.find((a) => a.info.nick == p.nick).hits += (p.weaponStats[weapons].hits);
                    allPlayers.find((a) => a.info.nick == p.nick).miss += (p.weaponStats[weapons].miss);
                    allPlayers.find((a) => a.info.nick == p.nick).deaths += (p.weaponStats[weapons].deaths);
                    allPlayers.find((a) => a.info.nick == p.nick).kills += (p.weaponStats[weapons].kills);
                    allPlayers.find((a) => a.info.nick == p.nick).games += 1;
                } else {
                    allPlayers.push({ games: 1, info: p, deaths: p.weaponStats[weapons].deaths ? p.weaponStats[weapons].deaths : 0, kills: p.weaponStats[weapons].kills ? p.weaponStats[weapons].kills : 0, hits: p.weaponStats[weapons].hits ? p.weaponStats[weapons].hits : 0, miss: p.weaponStats[weapons].miss ? p.weaponStats[weapons].miss : 0 });
                }
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
    fs.readdirSync("data").filter((a) => a.indexOf(".json") > -1).sort(dateSort).forEach((f, ind) => {
        let data = JSON.parse(fs.readFileSync(`data/${f}`).toString());
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
                allPlayers.find((a) => a.info.nick == p.nick).info.thw += p.thw;
            } else {
                allPlayers.push({ score: score, games: 1, info: p, damage: [p.damageGiven] });
            }
        })
    })
    allPlayers = allPlayers.filter((a) => a.games >= 5);
    allPlayers.forEach((p, i) => {
        p.damageAll = 0;
        p.damage.forEach(d => {
            p.damageAll += d;
        })
        p.damageAVG = `${(p.damageAll / p.damage.length).toFixed(0)}`
        p.damageAVGRound = `${(p.damageAll / p.score).toFixed(0)}`
    })
    allPlayers = allPlayers.sort(function (a, b) {
        if (a.damageAVGRound > b.damageAVGRound) return -1;
        if (a.damageAVGRound == b.damageAVGRound) return 0;
        if (a.damageAVGRound < b.damageAVGRound) return 1;
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
        weap.icon = "<:mg:699989376175702037>";
    }
    if (cmd == "sg" || cmd == "Shotgun") {
        weap.name = "Shotgun";
        weap.icon = "<:sg:699988730576109640>";
    }
    if (cmd == "gl" || cmd == "G.Launcher") {
        weap.name = "G.Launcher";
        weap.icon = "<:gl:699991852455297025>";
    }
    if (cmd == "rl" || cmd == "R.Launcher") {
        weap.name = "R.Launcher";
        weap.icon = "<:rl:699988929524531290>";
    }
    if (cmd == "lg" || cmd == "LightningGun:") {
        weap.name = "LightningGun:";
        weap.icon = "<:lg:699974840823840868>";
    }
    if (cmd == "rg" || cmd == "Railgun") {
        weap.name = "Railgun";
        weap.icon = "<:rg:699989080582258709>";
    }
    if (cmd == "pg" || cmd == "Plasmagun") {
        weap.name = "Plasmagun";
        weap.icon = "<:pg:699989212727869440>";
    }
    return weap
}