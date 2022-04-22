"use strict";

const { pluginId } = require("./pluginId");

/**
 * A helper function to obtain a plugin service
 * Credits: @ComfortablyCoding https://github.com/ComfortablyCoding/strapi-plugin-slugify/blob/master/server/utils/getPluginService.js
 * @return service
 */
const getPluginService = (strapi, name, plugin = pluginId) =>
  strapi.plugin(plugin).service(name);

module.exports = {
  getPluginService,
};
