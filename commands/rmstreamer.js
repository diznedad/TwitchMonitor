const MiniDb = require('../minidb');
const Discord = require('discord.js');
const prefix = process.env.DISCORD_PREFIX;

// TODO: Remove streamer's card if they're currently live when we remove them.

class RmStreamer {
  
  static category() {
    return "Twitch";
  }

  static helptext() {
    return `Removes a Twitch streamer from the watch list. You can specify multiple space-separated Twitch handles for quick removal. Usage: \`\`${prefix}${this.name.toString().trim().toLowerCase()} twitchhandle1\`\` or \`\`${prefix}${this.name.toString().trim().toLowerCase()} twitchhandle1 twitchhandle2\`\`.`;
  }
  
	static execute(message, args) {

    this._userDb = new MiniDb("twitch-users");
    this._userData = this._userDb.get("watch-list") || { };

    let watchedUsers = this._userData['usernames'] || [ ];
    let deletedUsers = [];
    let nonExistant = [];

    // Loop through all arguments for users to add to the list
    for (const user of args) {
      let userToDelete = user.toString().trim().toLowerCase();

      // Remove the '@' symbol if it exists.
      if(userToDelete.charAt(0) === '@') {
        userToDelete = userToDelete.substring(1);
      }

      // Whitespace or blank message
      if (!userToDelete.length) return;

      // If they're on the list, delete them
      let deleteIndex = watchedUsers.indexOf(userToDelete);
      if(deleteIndex !== -1) {
        watchedUsers.splice(deleteIndex, 1);
        deletedUsers.push(userToDelete);
      } else {
        nonExistant.push(userToDelete);
      }
    }
      
    this._userData['usernames'] = watchedUsers;
    this._userDb.put("watch-list", this._userData);

    deletedUsers.sort();
    nonExistant.sort();

    let msgEmbed = new Discord.MessageEmbed();

    msgEmbed.setColor("#FD6A02");
    msgEmbed.setTitle(`**Twitch Monitor**`);
    msgEmbed.addField(`Removed (${deletedUsers.length})`, deletedUsers.length > 0 ?deletedUsers.join('\n') : "None", true);
    msgEmbed.addField(`Skipped (${nonExistant.length})`, nonExistant.length > 0 ?nonExistant.join('\n') : "None", true);

    let msgToSend = "";

    let msgOptions = {
        embed: msgEmbed
    };

    message.channel.send(msgToSend, msgOptions)
        .then((message) => {
            console.log('[Discord-Rem]', `${deletedUsers.length} deleted. ${nonExistant.length} skipped.`)
        })
        .catch((err) => {
            console.log('[Discord-Rem]', `Could not send msg to #${message.channel.name}`, err.message);
        });
	}
}

module.exports = RmStreamer;