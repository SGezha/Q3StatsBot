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
    bans = "lagz-sr, p",
    bot = new TelegramBot(`1278792395:AAHk8mFilPMfV70UQXg4RNGXwxdZxBgbyQ4`, { polling: true }),
    admins = "149521299562037249";

bd.connect();

start();

async function start() {
    let temp = await bd.query(`SELECT * FROM "public"."matches" ORDER BY "id" DESC`);
    All_games = temp.rows;
    
    let matches = [];
    
    All_games.forEach(el => {
        let p = el.json;
        let obj = {};
        let mode = "3v3";
        if(p.players.length > 6) {
            mode = "4v4";
        }
        if(p.players.length > 8) {
            mode = "5v5";
        }
        obj.mode = mode; 
        p.players.forEach((pl) => {
            obj[`${pl.nick}-dmg`] = pl.damageGiven;
        })
        matches.push(obj);
    });
    
    fs.writeFileSync("games.json", JSON.stringify(matches));

}