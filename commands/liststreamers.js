const MiniDb = require('../minidb');
const Discord = require('discord.js');
const prefix = process.env.DISCORD_PREFIX;

class ListStreamers {
  
  static category() {
    return "Twitch";
  }

  static helptext() {
    return `Lists all streamers the bot is currently watching.`;
  }

  static execute(message, args, guildConfig) {

    this._userDb = new MiniDb("twitch-users");
    this._userData = this._userDb.get("watch-list") || {};

    let watchedUsers = this._userData['usernames'] || [];
    watchedUsers.sort();

    let msgEmbed = new Discord.MessageEmbed();

    msgEmbed.setColor("#FD6A02");
    msgEmbed.setTitle(`**Twitch Monitor**`);
    msgEmbed.addField(`Watch List (${watchedUsers.length})`, watchedUsers.length > 0 ? watchedUsers.join('\n') : "None", true);

    let msgToSend = "";

    let msgOptions = {
      embed: msgEmbed
    };

    message.channel.send(msgToSend, msgOptions)
      .then((message) => {
        console.log('[Discord-List]', `${watchedUsers.length} users listed.`);
      })
      .catch((err) => {
        console.log('[Discord-List]', `Could not send msg to #${message.channel.name}`, err.message);
      });
  }
}

module.exports = ListStreamers;