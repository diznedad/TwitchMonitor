const MiniDb = require('../minidb');
const Discord = require('discord.js');
const prefix = process.env.DISCORD_PREFIX;

// TODO: per-server prefix
// TODO: persist change

class SetPrefix {
  static category() {
    return "Bot";
  }

  static helptext() {
    return `Changes the bot's prefix. The current prefix is \`\`${prefix}\`\`. Usage: \`\`${prefix}${this.name.toString().trim().toLowerCase()} newprefix\`\`.`;
  }

	static execute(message, args) {
    if(args[0]) {
      let newPrefix = args[0].toString().trim();
      process.env.DISCORD_PREFIX = newPrefix;
      let msgEmbed = new Discord.MessageEmbed()
        .setColor("#FD6A02")
        .setTitle(`**Twitch Monitor**`)
        .addField(`Previx`, `Bot prefix set to ${newPrefix}`, true);
    
      message.channel.send(msgEmbed)
          .then((message) => {
              console.log('[SetPrefix]', `Set bot prefix to ${newPrefix}.`)
          })
          .catch((err) => {
              console.log('[SetPrefix]', `Could not send msg to #${message.channel.name}`, err.message);
          });
    }
	}
}
module.exports = SetPrefix;