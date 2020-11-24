const Dotenv = require('dotenv').config();
const axios = require('axios');
const MiniDb = require('./minidb');
const Discord = require('discord.js');

/**
 * Discord guild event functions
 */
class DiscordGuild {
  //Expects discord guild object
  constructor(guild) {
    this.config = new MiniDb('guilds');
    this.guild = guild;
    console.log(`[Guild]`, `[${guild.name}]`, `New Guild object for ${guild.name}`);
    this.guildConfig = this.checkGuildConfig();
  }

  checkGuildConfig() {
    // Pull guild config. Create config if not exists.
    let guildConfig = this.config.get(this.guild.id) || null;

    // Grab the template config to compare / update if required.
    let templateConfig = this.config.get("template") || null;

    // TODO: Handle null template (throw exception?)

    if (guildConfig === null) {
      // Guild config didn't exist. Need to create a new config from the template
      console.log(`[Guild]`, `[${this.guild.name}]`, `Guild config does't exist. Create a new config from template.`);
      this.config.put(this.guild.id, templateConfig);
      return templateConfig;

    } else {
      // Check for any missing props and add them
      console.log(`[Guild]`, `[${this.guild.name}]`, `Guild config does exist. Check for updated template.`);
      guildConfig = this.updateGuildConfig(guildConfig, templateConfig);
    }

    // Config exists and is up to date
    console.log(`[Guild]`, `[${this.guild.name}]`, `Guild config exists and is up to date.`);
    return guildConfig;
  }

  updateGuildConfig(guildConfig, templateConfig) {

    Object.keys(templateConfig).every(function(prop) {
      if (!guildConfig.hasOwnProperty(prop)) {
        guildConfig[prop] = templateConfig[prop];
      }
    });

    // return new object
    return guildConfig;
  }

  // Get a value from the guild config
  get(property) {
    let guildConfig = this.config.get(this.guild.id);
    return guildConfig.hasOwnProperty(property) ? guildConfig[property] : null;
  }

  // Update guild config
  put(property, value) {
    let guildConfig = this.config.get(this.guild.id);
    if(guildConfig.hasOwnProperty(property)) {
      guildConfig[property] = value;
    }
    this.config.put(this.guild.id, guildConfig);
  }
}

module.exports = DiscordGuild;