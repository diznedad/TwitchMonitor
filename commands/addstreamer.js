const MiniDb = require('../minidb');
const Discord = require('discord.js');
const prefix = process.env.DISCORD_PREFIX;

class AddStreamer {
  static category() {
    return "Twitch";
  }

  static helptext() {
    return `Adds a Twitch streamer to the watch list. You can specify multiple space-separated Twitch handles for quick addition. Usage: \`\`${prefix}${this.name.toString().trim().toLowerCase()} twitchhandle1\`\` or \`\`${prefix}${this.name.toString().trim().toLowerCase()} twitchhandle1 twitchhandle2\`\`.`;
  }

	static execute(message, args) {

    this._userDb = new MiniDb("twitch-users");
    this._userData = this._userDb.get("watch-list") || { };

    let watchedUsers = this._userData['usernames'] || [ ];
    let addedUsers = [];
    let duplicates = [];

    // Loop through all arguments for users to add to the list
    for (const user of args) {
      let userToAdd = user.toString().trim().toLowerCase();

      // Remove the '@' symbol if it exists.
      if(userToAdd.charAt(0) === '@') {
        userToAdd = userToAdd.substring(1);
      }

      // Whitespace or blank message
      if (!userToAdd.length) return;

      // If they're not already on the list, add them
      if(watchedUsers.indexOf(userToAdd) === -1) {
        watchedUsers.push(userToAdd);
        addedUsers.push(userToAdd);
      } else {
        duplicates.push(userToAdd);
      }
    }
      
    this._userData['usernames'] = watchedUsers;
    this._userDb.put("watch-list", this._userData);

    addedUsers.sort();
    duplicates.sort();

    let msgEmbed = new Discord.MessageEmbed();

    msgEmbed.setColor("#FD6A02");
    msgEmbed.setTitle(`**Twitch Monitor**`);
    msgEmbed.addField(`Added (${addedUsers.length})`, addedUsers.length > 0 ?addedUsers.join('\n') : "None", true);
    msgEmbed.addField(`Skipped (${duplicates.length})`, duplicates.length > 0 ?duplicates.join('\n') : "None", true);

    let msgToSend = "";

    let msgOptions = {
        embed: msgEmbed
    };

    message.channel.send(msgToSend, msgOptions)
        .then((message) => {
            console.log('[Discord-Add]', `${addedUsers.length} added. ${duplicates.length} duplicates.`)
        })
        .catch((err) => {
            console.log('[Discord-Add]', `Could not send msg to #${message.channel.name}`, err.message);
        });
	}
}
module.exports = AddStreamer;