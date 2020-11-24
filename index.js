const axios = require('axios');
const fs = require('fs');
const Dotenv = require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
global.discordJsClient = client;
client.commands = new Discord.Collection();

const DiscordChannelSync = require("./discord-channel-sync");
const LiveEmbed = require('./live-embed');
const MiniDb = require('./minidb');
const TwitchMonitor = require('./twitch-monitor');
const DiscordGuild = require('./discord-guild');

// --- Startup -------------------------------------------
console.log('Bot starting.');

// --- Discord Commands ----------------------------------
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log(`[Discord]`, `Discovered ${commandFiles.length} command file(s).`);

// grab all the command files from the command directory
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  var cmdName = command.name.toString().trim().toLowerCase();
  client.commands.set(cmdName, command);
  console.log(`[Discord]`, `Added ${cmdName} to active command list.`);
}
console.log(`[Discord]`, `Finished loading commands.`);

// --- Discord -------------------------------------------
console.log(`[Discord]`, `Connecting to Discord...`);

let targetChannels = [];

let syncServerList = (logMembership) => {
  targetChannels = DiscordChannelSync.getChannelList(client, process.env.DISCORD_ANNOUNCE_CHANNEL, logMembership);
};

// Connected to Discord
client.on('ready', () => {
  console.log('[Discord]', `Bot is ready; logged in as ${client.user.tag}.`);

  // Init list of connected servers, and determine which channels we are announcing to
  syncServerList(true);

  if (process.env.TEST_MODE == false) {
    // Keep our activity in the user list in sync
    StreamActivity.init(client);

    // Begin Twitch API polling
    TwitchMonitor.start();
  }
});

// Added to a new server
client.on("guildCreate", guild => {
  console.log(`[Discord]`,`[${guild.name}]`, `Joined new server: ${guild.name}`);

  let thisGuild = new DiscordGuild(guild);
  console.log(`[Discord]`,`[${guild.name}]`, `Created configuration for ${guild.name}`);

  syncServerList(false);
});

// Removed from a server
client.on("guildDelete", guild => {
  console.log(`[Discord]`, `Removed from a server: ${guild.name}`);

  syncServerList(false);
});

let lastTextReplyAt = 0;

client.on('message', message => {
  // Empty or bot message
  if (!message.content || message.author.bot) return;

  let txtPlain = message.content.toString().trim();
  let txtLower = txtPlain.toLowerCase();

  // Whitespace or blank message
  if (!txtLower.length) return;

  // Get the guild in which the message was sent
  let theGuild = new DiscordGuild(message.guild);

  let prefix = theGuild.get("discordPrefix");

  // Not a command
  if (txtLower.charAt(0) !== prefix) return;

  let now = Date.now();

  // Only admins can run commands
  if (message.member.hasPermission("ADMINISTRATOR")) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    console.log(`[Discord]`, `[${message.guild.name}]`, `${command} command received from @${message.member.displayName}. Command Exists: ${client.commands.has(command)}`);

    if (!client.commands.has(command)) return;

    // Run the actual command
    try {
      client.commands.get(command).execute(message, args);
    } catch (e) {
      console.warn('[Discord]', 'Command execution problem:', e);
      message.reply('There was an error trying to execute that command!');
    }
  }
});

console.log('[Discord]', 'Logging in...');
client.login(process.env.DISCORD_BOT_TOKEN);

// Activity updater
class StreamActivity {
  /**
   * Registers a channel that has come online, and updates the user activity.
   */
  static setChannelOnline(stream) {
    this.onlineChannels[stream.user_name] = stream;

    this.updateActivity();
  }

  /**
   * Marks a channel has having gone offline, and updates the user activity if needed.
   */
  static setChannelOffline(stream) {
    delete this.onlineChannels[stream.user_name];

    this.updateActivity();
  }

  /**
   * Updates the user activity on Discord.
   * Either clears the activity if no channels are online, or sets it to "watching" if a stream is up.
   */
  static updateActivity() {
    let numStreams = Object.keys(this.onlineChannels).length;
    let activity = `${numStreams} stream${numStreams == 1 ? "" : "s"}`;
    this.discordClient.user.setActivity(activity, {
      "type": "WATCHING"
    });

    console.log('[StreamActivity]', `Update current activity: watching ${activity}.`);
  }

  static init(discordClient) {
    this.discordClient = discordClient;
    this.onlineChannels = {};

    this.updateActivity();

    // Continue to update current stream activity every 5 minutes or so
    // We need to do this b/c Discord sometimes refuses to update for some reason
    // ...maybe this will help, hopefully
    setInterval(this.updateActivity.bind(this), 5 * 60 * 1000);
  }
}

// --- Live events -------------------------------------------

let liveMessageDb = new MiniDb('live-messages');
let messageHistory = liveMessageDb.get("history") || {};

TwitchMonitor.onChannelLiveUpdate((streamData) => {
  const isLive = streamData.type === "live";

  // Refresh channel list
  try {
    syncServerList(false);
  } catch (e) { }

  // Update activity
  StreamActivity.setChannelOnline(streamData);

  // Generate message
  const msgFormatted = `${streamData.user_name} went live on Twitch!`;
  const msgEmbed = LiveEmbed.createForStream(streamData);

  // Broadcast to all target channels
  let anySent = false;

  for (let i = 0; i < targetChannels.length; i++) {
    const discordChannel = targetChannels[i];
    const liveMsgDiscrim = `${discordChannel.guild.id}_${discordChannel.name}_${streamData.id}`;

    if (discordChannel) {
      try {
        // Either send a new message, or update an old one
        let existingMsgId = messageHistory[liveMsgDiscrim] || null;

        if (existingMsgId) {
          // Fetch existing message
          discordChannel.messages.fetch(existingMsgId)
            .then((existingMsg) => {
              existingMsg.edit(msgFormatted, {
                embed: msgEmbed
              }).then((message) => {
                // Clean up entry if no longer live
                if (!isLive) {
                  console.log('[Twitch]', `${streamData.user_name} went offline.`);
                  // Delete the message from discord
                  existingMsg.delete();

                  // Clean up DB
                  delete messageHistory[liveMsgDiscrim];
                  liveMessageDb.put('history', messageHistory);
                }
              });
            })
            .catch((e) => {
              // Unable to retrieve message object for editing
              if (e.message === "Unknown Message") {
                // Specific error: the message does not exist, most likely deleted.
                delete messageHistory[liveMsgDiscrim];
                liveMessageDb.put('history', messageHistory);
                // This will cause the message to be posted as new in the next update if needed.
              }
            });
        } else {
          // Sending a new message
          if (!isLive) {
            // We do not post "new" notifications for channels going/being offline
            continue;
          }

          let msgToSend = msgFormatted;

          let msgOptions = {
            embed: msgEmbed
          };

          discordChannel.send(msgToSend, msgOptions)
            .then((message) => {
              console.log('[Discord]', `Sent announce msg to #${discordChannel.name} on ${discordChannel.guild.name}`)

              messageHistory[liveMsgDiscrim] = message.id;
              liveMessageDb.put('history', messageHistory);
            })
            .catch((err) => {
              console.log('[Discord]', `Could not send announce msg to #${discordChannel.name} on ${discordChannel.guild.name}:`, err.message);
            });
        }

        anySent = true;
      } catch (e) {
        console.warn('[Discord]', 'Message send problem:', e);
      }
    }
  }

  liveMessageDb.put('history', messageHistory);
  return anySent;
});

TwitchMonitor.onChannelOffline((streamData) => {
  // Update activity
  StreamActivity.setChannelOffline(streamData);
});

// --- Common functions -------------------------------------------
String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};

String.prototype.spacifyCamels = function() {
  let target = this;

  try {
    return target.replace(/([a-z](?=[A-Z]))/g, '$1 ');
  } catch (e) {
    return target;
  }
};

Array.prototype.joinEnglishList = function() {
  let a = this;

  try {
    return [a.slice(0, -1).join(', '), a.slice(-1)[0]].join(a.length < 2 ? '' : ' and ');
  } catch (e) {
    return a.join(', ');
  }
};

String.prototype.lowercaseFirstChar = function() {
  let string = this;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

Array.prototype.hasEqualValues = function(b) {
  let a = this;

  if (a.length !== b.length) {
    return false;
  }

  a.sort();
  b.sort();

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}