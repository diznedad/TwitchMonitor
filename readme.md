# Twitch Monitor
🤖 **A simple Discord bot that maintains a list of live Twitch streams in a Discord channel.**

Much of the code (and like 100% of the installation instructions below) was used from [Timbot](https://github.com/roydejong/timbot). I removed extraneous features, added the ability to dynamically add/remove watched streamers, and made it delete cards when streamers go offline.

### Feeling generous?
[![Buy me a Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/brofar)

## Features
* Monitors Twitch streamers and posts on discord when they're live.
* Updates streamer card in the channel with uptime/game changes.
* Deletes streamer card from channel when streamer goes offline.
* Discord commands to add/remove/list watched streamers (!addstreamer/!removestreamer/!liststreamers).

## To Do
* Multi-server support
* discord-guild.js: Handle null template (throw exception?)
* Change bot options via commmands (set channel, box art bool, screenshot bool, etc)
* Bot icon
* Handle orphanated posts

## Installation and setup

### Prerequisites

This bot is built with Node.js. Install the latest LTS version from [the official website](https://nodejs.org/en/download).

### Installation

To set up the bot, clone it using `git`:

    git clone git@github.com:brofar/TwitchMonitor.git
    
Once installed, enter the directory and install the dependencies:

    cd TwitchMonitor
    npm install

### Configuration
 
To configure the bot, copy the included `.env.sample` to `.env` and enter or customize the values in the file. 

Configuration options explained:

|Key|Required?|Description|
|---|---------|-----------|
|`DISCORD_ANNOUNCE_CHANNEL`|☑|Channel name to post stream announcements in. Make sure the bot has permissions to post here.|
|`DISCORD_BOT_TOKEN`|☑|Your bot token, via Discord developer portal (explained below).|
|`TWITCH_CLIENT_ID`|☑|Client ID for your Twitch app, via developer portal (explained below).|
|`TWITCH_OAUTH_TOKEN`|☑|OAuth token that grants access to your Twitch app, via `id.twitch.tv` as explained below.|
|`DISCORD_PREFIX`|☑|Prefix for the bot's commands.|
|`TWITCH_CHECK_INTERVAL_MS`| |How often to poll the Twitch API and send or update live embeds.|
|`TWITCH_USE_BOXART`| |If true, use alternate Live Embed style that includes game boxart as a thumbnail image if available.|

### Getting required tokens

Note that you will need to set up some external applications: 

#### Discord bot application
Your Discord bot needs to be registered as an application, and you will need a bot token  (`DISCORD_BOT_TOKEN` in .env).

Follow [this guide](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token) for more information.

#### Twitch application
To connect to the Twitch API, you will need to register a new application in the [Twitch Developers Console](https://dev.twitch.tv/console/apps).

You will need to grab the Client ID (`TWITCH_CLIENT_ID` in .env).

#### Twitch OAuth token
To make things more complicated, all requests  to the Twitch API need to be authenticated with an OAuth grant generated by your own application.

To begin the authorization flow, you'll need to complete the authorization prompt yourself:
 
```
https://id.twitch.tv/oauth2/authorize?client_id=TWITCH_CLIENT_ID&response_type=token&redirect_uri=http://localhost
```

You can grab the `access_token` from the redirect URL in your browser, and store it as `TWITCH_OAUTH_TOKEN` in .env. 

### Starting the bot

Once the application has been configured, start it using `node` from the installation directory:

    node .
  
### Inviting the bot to your Discord server

Send the following link to the admin of a Discord server to let them invite the Bot:

  `https://discord.com/api/oauth2/authorize?client_id=BOT_CLIENT_ID&permissions=92160&scope=bot`
  
Swap `BOT_CLIENT_ID` in the URL above for your Discord app's client id, which you can find in the app details.

Ensure that, at minimum, the bot has `Send Messages`, `Manage Messages`, and `Embed Links` in the announce channel.