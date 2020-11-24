const MiniDb = require('../minidb');
const Discord = require('discord.js');
const DiscordGuild = require('../discord-guild');

// TODO: per-server prefix
// TODO: persist change

class SetPrefix {
  static category() {
    return "Bot";
  }

  static helptext() {
    return `Changes the bot's command prefix.`;
  }

	static execute(message, args) {
    if(args[0]) {
      // Get the guild in which the message was sent
      let theGuild = new DiscordGuild(message.guild);
      let prefix = theGuild.get("discordPrefix");

      let newPrefix = args[0].toString().trim();
      theGuild.put("discordPrefix", newPrefix);
      let msgEmbed = new Discord.MessageEmbed()
        .setColor("#FD6A02")
        .setTitle(`**Twitch Monitor**`)
        .addField(`Previx`, `Bot prefix set to ${newPrefix}`, true);
    
      message.channel.send(msgEmbed)
          .then((message) => {
              console.log('[SetPrefix]', `[${message.guild.name}]`, `Set bot prefix to ${newPrefix}.`)
          })
          .catch((err) => {
              console.log('[SetPrefix]', `[${message.guild.name}]`, `Could not send msg to #${message.channel.name}`, err.message);
          });
    }
	}
}
module.exports = SetPrefix;