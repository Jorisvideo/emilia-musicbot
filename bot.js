var errorlog = require("./data/errors.json")

const Discord = require("discord.js"),
con = console.log,
git = require('git-rev');

git.short(commit => git.branch(branch => {
  console.log(`Emilia#${branch}@${commit}`);
}));
const CURRENT_REV = "0.1.6";
try {
    var config = require('./config.json');
    con("Config file detected!");
} catch (err) {
    con(err);
    con("No config detected, attempting to use environment variables...");
    if (process.env.MUSIC_BOT_TOKEN && process.env.YOUTUBE_API_KEY) {
        var config = {
            "token": process.env.MUSIC_BOT_TOKEN,
            "client_id": "",
            "prefix": "!",
            "owner_id": "193090359700619264",
            "status": "Musicccc",
            "youtube_api_key": process.env.YOUTUBE_API_KEY,
            "admins": ["193090359700619264"]
        }
    } else {
        con("No token passed! Exiting...")
        process.exit(0)
    }
}
const admins = config.admins,
client = new Discord.Client(),
language = config.language,
prefix = config.prefix,
fs = require("fs"),
queues = {},
ytdl = require('ytdl-core'),
search = require('youtube-search'),
opts = {
    part: 'snippet',
    maxResults: 10,
    key: config.youtube_api_key
}
var intent;

function getQueue(guild) {
    if (!guild) return
    if (typeof guild == 'object') guild = guild.id
    if (queues[guild]) return queues[guild]
    else queues[guild] = []
    return queues[guild]
}

function getRandomInt(max) {
    return Math.floor(Math.random() * (max + 1));
}

var paused = {}

//Fix dis shit
function getRandomMusic(queue, msg) {
    fs.readFile('./data/autoplaylist.txt', 'utf8', function(err, data) {
        if (err) throw err;
        con('OK: autoplaylist.txt');
        var random = data.split('\n');
        var num = getRandomInt(random.length);
        con(random[num])
        var url = random[num];
        msg.author.username = "AUTOPLAYLIST";
        play(msg, queue, url)
    });
}

function play(msg, queue, song) {
    try {
        if (!msg || !queue) return;
        if (song) {
            search(song, opts, function(err, results) {
                if (err) return msg.channel.sendMessage("Video not found please try to use a youtube link instead.");
                song = (song.includes("https://" || "http://")) ? song : results[0].link
                let stream = ytdl(song, {
                    audioonly: true
                })
                let test
                if (queue.length === 0) test = true
                queue.push({
                    "title": results[0].title,
                    "requested": msg.author.username,
                    "toplay": stream
                })
                con("Queued " + queue[queue.length - 1].title + " in " + msg.guild.name + " as requested by " + queue[queue.length - 1].requested)
                msg.channel.sendMessage({
                embed: {
                    author: {
                        name: client.user.username,
                        icon_url: client.user.avatarURL,
                        url: "http://takohell.com:3000"
                    },
                    color: 0x00FF00,
                    title: `Queued`,
                    description: "**" + queue[queue.length - 1].title + "**"
                }
                    }).then(response => { response.delete(5000) });
                if (test) {
                    setTimeout(function() {
                        play(msg, queue)
                    }, 1000)
                }
            })
        } else if (queue.length != 0) {
                        msg.channel.sendMessage({
        embed: {
            author: {
                name: client.user.username,
                icon_url: client.user.avatarURL,
                url: "http://takohell.com:3000"
            },
            color: 0x00FF00,
            title: `Now Playing`,
            description: `**${queue[0].title}** | Requested by ***${queue[0].requested}***`
        }
            }).then(response => { response.delete(5000) });
            con(`Playing ${queue[0].title} as requested by ${queue[0].requested} in ${msg.guild.name}`);
            client.user.setGame(queue[0].title);
            let connection = msg.guild.voiceConnection
            if (!connection) return con("No Connection!");
            intent = connection.playStream(queue[0].toplay)

            intent.on('error', () => {
                queue.shift()
                play(msg, queue)
            })

            intent.on('end', () => {
                queue.shift()
                play(msg, queue)
            })
        } else {
            msg.channel.sendMessage('No more music in queue! Starting autoplaylist').then(response => { response.delete(5000) });
            getRandomMusic(queue, msg);
        }
    } catch (err) {
        con("WELL LADS LOOKS LIKE SOMETHING WENT WRONG! Visit Joris vidéo server for support (https://discord.gg/E8tXHqC) and quote this error:\n\n\n" + err.stack)
        errorlog[String(Object.keys(errorlog).length)] = {
            "code": err.code,
            "error": err,
            "stack": err.stack
        }
        fs.writeFile("./data/errors.json", JSON.stringify(errorlog), function(err) {
            if (err) return con("Even worse we couldn't write to our error log file! Make sure data/errors.json still exists!");
        })
    }
}
function isCommander(id) {
	if(id === config.owner_id) {
		return true;
	}
	for(var i = 0; i < admins.length; i++){
		if(admins[i] == id) {
			return true;
		}
	}
	return false;
}
if (language == "fr") {
    con("French language detected. Logs are still in English.");
} else if (language == "en") {
    con("English language detected.");
} else {
    con("Language could not be detected. Defaulting to English.");
}
client.on('ready', function() {
    try {
        config.client_id = client.user.id;
        client.user.setStatus('online', config.status)
        if (language == "fr") {
            var msg = `
------------------------------------------------------
> version 0.1.5
> Faites 'git pull' périodiquement pour garder votre bot à jour!
> Connexion en cours ...
------------------------------------------------------
Connecté en tant que ${client.user.username} [ID ${client.user.id}]
Present dans ${client.guilds.size} serveurs !
Present dans ${client.channels.size} channels et ${client.users.size} utilisateurs en cache!
Creer par Silver Crow
Bot est connecté et prêt à jouer des morceaux!
Allons-y
------------------------------------------------------`
}else{
        var msg = `
------------------------------------------------------
> version 0.1.5
> Do 'git pull' periodically to keep your bot updated! 
> Logging in...
------------------------------------------------------
Logged in as ${client.user.username} [ID ${client.user.id}]
On ${client.guilds.size} servers!
${client.channels.size} channels and ${client.users.size} users cached!
Created by Silver Crow
Bot is logged in and ready to play some tunes!
LET'S GO!
------------------------------------------------------`
}


        con(msg)
        var errsize = Number(fs.statSync("./data/errors.json")["size"])
        con("Current error log size is " + errsize + " Bytes")
        if (errsize > 5000) {
            errorlog = {}
            fs.writeFile("./data/errors.json", JSON.stringify(errorlog), function(err) {
                if (err) return con("Uh oh we couldn't wipe the error log");
                con("Just to say, we have wiped the error log on your system as its size was too large")
            })
        }
        con("------------------------------------------------------")
    } catch (err) {
        con("WELL LADS LOOKS LIKE SOMETHING WENT WRONG! Visit Joris vidéo for support (https://discord.gg/E8tXHqC) and quote this error:\n\n\n" + err.stack)
        errorlog[String(Object.keys(errorlog).length)] = {
            "code": err.code,
            "error": err,
            "stack": err.stack
        }
        fs.writeFile("./data/errors.json", JSON.stringify(errorlog), function(err) {
            if (err) return con("Even worse we couldn't write to our error log file! Make sure data/errors.json still exists!");
        })

    }
})

client.on('voiceStateUpdate', function(oldMember, newMember) {
	var svr = client.guilds.array()
    for (var i = 0; i < svr.length; i++) {
        if (svr[i].voiceConnection) {
            if (paused[svr[i].voiceConnection.channel.id]) {
                if (svr[i].voiceConnection.channel.members.size > 1) {
					paused[svr[i].voiceConnection.channel.id].player.resume()
					var game = client.user.presence.game.name;
                    delete paused[svr[i].voiceConnection.channel.id]
                    game = game.split("⏸")[1];
					client.user.setGame(game);
                }
            }
            if (svr[i].voiceConnection.channel.members.size === 1 && !svr[i].voiceConnection.player.dispatcher.paused) {
                svr[i].voiceConnection.player.dispatcher.pause();
                var game = client.user.presence.game.name;
                paused[svr[i].voiceConnection.channel.id] = {
                    "player": svr[i].voiceConnection.player.dispatcher
                }
                client.user.setGame("⏸ " + game);
            }
        }
    }
});

client.on("message", function(msg) {
    const msga = msg.content;
    try {
		if (msg.channel.type === "dm") return;
        if (msg.author === client.user)
            if (msg.guild === undefined) {
                msg.channel.sendMessage("The bot only works in servers!")

                return;
            }
        if (msga.startsWith(prefix + 'play')) {
            if (!msg.guild.voiceConnection) {
                if (!msg.member.voiceChannel) return msg.channel.sendMessage('You need to be in a voice channel')
                var chan = msg.member.voiceChannel
                chan.join()
            }
            let suffix = msga.split(" ").slice(1).join(" ")
            if (!suffix) return msg.channel.sendMessage('You need to specify a song link or a song name!')

            play(msg, getQueue(msg.guild.id), suffix)
        }
        if (msga.startsWith(prefix + 'leave')) {
            if (!msg.guild.voiceConnection) {
                if (!msg.member.voiceChannel) return msg.channel.sendMessage('You need to be in a voice channel')
                var chan = msg.member.voiceChannel
                chan.leave();
                let queue = getQueue(msg.guild.id);
                if (queue.length == 0) return msg.channel.sendMessage(`No music in queue`).then(response => { response.delete(5000) });
                for (var i = queue.length - 1; i >= 0; i--) {
                    queue.splice(i, 1);
                }
                msg.channel.sendMessage(`Cleared the queue`).then(response => { response.delete(5000) });
            }
        }
        if (msga.startsWith(prefix +`infomusic`)) {
            git.short(commit => git.branch(branch => {
              msg.channel.sendMessage(`Version: \`Emilia#${branch}@${commit}\` (cf: ${config.configRev} cr: ${CURRENT_REV}). Info about Emilia music bot can be found at https://github.com/Jorisvideo/emilia-musicbot.`);
            }));
        }
        if (msga.startsWith(prefix + "clear")) {
            if (msg.guild.owner.id == msg.author.id || msg.author.id == config.owner_id || config.admins.indexOf(msg.author.id) != -1 || msg.channel.permissionsFor(msg.member).hasPermission('MANAGE_SERVER')) {
                let queue = getQueue(msg.guild.id);
                if (queue.length == 0) return msg.channel.sendMessage(`No music in queue`).then(response => { response.delete(5000) });
                for (var i = queue.length - 1; i >= 0; i--) {
                    queue.splice(i, 1);
                }
                msg.channel.sendMessage(`Cleared the queue`).then(response => { response.delete(5000) })
            } else {
                msg.channel.sendMessage('Only the admins can do this command').then(response => { response.delete(5000) });
            }
        }

        if (msga.startsWith(prefix + 'skip')) {
        if (!msg.member.voiceChannel) return msg.channel.sendMessage('You need to be in a voice channel')
                let player = msg.guild.voiceConnection.player.dispatcher
                if (!player || player.paused) return msg.channel.sendMessage("Bot is not playing!").then(response => { response.delete(5000) });
                msg.channel.sendMessage('Skipping song...').then(response => { response.delete(5000) });
                player.end()
        }

        if (msga.startsWith(prefix + 'pause')) {
            if (msg.guild.owner.id == msg.author.id || msg.author.id == config.owner_id || config.admins.indexOf(msg.author.id) != -1) {
                if (!msg.member.voiceChannel) return msg.channel.sendMessage('You need to be in a voice channel').then(response => { response.delete(5000) });
                let player = msg.guild.voiceConnection.player.dispatcher
                if (!player || player.paused) return msg.channel.sendMessage("Bot is not playing").then(response => { response.delete(5000) });
                player.pause();
                msg.channel.sendMessage("Pausing music...").then(response => { response.delete(5000) });
            } else {
                msg.channel.sendMessage('Only admins can use this command!').then(response => { response.delete(5000) });
            }
        }
        if (msga.startsWith(prefix + 'volume')) {
            let suffix = msga.split(" ")[1];
            var player = msg.guild.voiceConnection.player.dispatcher
            if (!player || player.paused) return msg.channel.sendMessage('No music m8, queue something with `' + prefix + 'play`');
            if (!suffix) {
                msg.channel.sendMessage(`The current volume is ${(player.volume * 100)}`).then(response => { response.delete(5000) });
            } else if (msg.guild.owner.id == msg.author.id || msg.author.id == config.owner_id || config.admins.indexOf(msg.author.id) != -1) {
                let volumeBefore = player.volume
                let volume = parseInt(suffix);
                if (volume > 100) return msg.channel.sendMessage("The music can't be higher then 100").then(response => { response.delete(5000) });
                player.setVolume((volume / 100));
                msg.channel.sendMessage(`Volume changed from ${(volumeBefore * 100)} to ${volume}`).then(response => { response.delete(5000) });
            } else {
                msg.channel.sendMessage('Only admins can change the volume!').then(response => { response.delete(5000) });
            }
        }

        if (msga.startsWith(prefix + 'resume')) {
            if (msg.guild.owner.id == msg.author.id || msg.author.id == config.owner_id || config.admins.indexOf(msg.author.id) != -1) {
                if (!msg.member.voiceChannel) return msg.channel.sendMessage('You need to be in a voice channel').then(response => { response.delete(5000) });
                let player = msg.guild.voiceConnection.player.dispatcher
                if (!player) return msg.channel.sendMessage('No music is playing at this time.').then(response => { response.delete(5000) });
                if (player.playing) return msg.channel.sendMessage('The music is already playing').then(response => { response.delete(5000) });
                var queue = getQueue(msg.guild.id);
                client.user.setGame(queue[0].title);
                player.resume();
                msg.channel.sendMessage("Resuming music...").then(response => { response.delete(5000) });
            } else {
                msg.channel.sendMessage('Only admins can do this command').then(response => { response.delete(5000) });
            }
        }

        if (msga.startsWith(prefix + 'current') || msga.startsWith(prefix + 'nowplaying')) {
            let queue = getQueue(msg.guild.id);
            if (queue.length == 0) return msg.channel.sendMessage(msg, "No music in queue");
            msg.channel.sendMessage({
                embed: {
                    author: {
                        name: client.user.username,
                        icon_url: client.user.avatarURL,
                        url: "http://takohell.com:3000"
                    },
                    color: 0x00FF00,
                    title: `Currently playing`,
                    description: `${queue[0].title} | by ${queue[0].requested}`
                }
            }).then(response => { response.delete(5000) });
        }

        if (msga.startsWith(prefix + 'queue')) {
            let queue = getQueue(msg.guild.id);
            if (queue.length == 0) return msg.channel.sendMessage("No music in queue");
            let text = '';
            for (let i = 0; i < queue.length; i++) {
                text += `${(i + 1)}. ${queue[i].title} | requested by ${queue[i].requested}\n`
            };
            msg.channel.sendMessage({
                embed: {
                    author: {
                        name: client.user.username,
                        icon_url: client.user.avatarURL,
                        url: "http://takohell.com:3000"
                    },
                    color: 0x00FF00,
                    title: `Queue`,
                    description: `\n${text}`
                }
            }).then(response => { response.delete(5000) });
        }
    } catch (err) {
        con("WELL LADS LOOKS LIKE SOMETHING WENT WRONG! Visit Joris Video and quote this error:\n\n\n" + err.stack)
        errorlog[String(Object.keys(errorlog).length)] = {
            "code": err.code,
            "error": err,
            "stack": err.stack
        }
        fs.writeFile("./data/errors.json", JSON.stringify(errorlog), function(err) {
            if (err) return con("Even worse we couldn't write to our error log file! Make sure data/errors.json still exists!");
        })

    } if (language == "fr") {
        if (msga === '!aide') {
            msg.channel.sendMessage("Bonjour! Je m'appelle Emilia-bot-music!\nVoici ma liste de commandes:\n`!aide`: Pour savoir ma liste de commandes.\n`! \nEnjoy!");
            }
        }
    if (language == "en") {
        if (msga === "!help") {
            msg.channel.sendMessage("Hi! My name is Emilia-bot-music!\nHere is my command list:\n`!help`: To know my command list.\n` :) \nEnjoy!");
            }
        }
})

client.login(config.token)

process.on("unhandledRejection", err => {
    console.error("Uncaught We had a promise error, if this keeps happening report to dev server: \n" + err.stack);
});
