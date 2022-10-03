"use strict";

const { registerGraphlQLQuery } = require("./graphql");
const { getPluginService } = require("./utils/getPluginService");

module.exports = ({ strapi }) => {
  const settingsService = getPluginService(strapi, "settingsService");

  const settings = settingsService.get();
  // build settings structure
  const normalizedSettings = settingsService.build(settings);
  // reset plugin settings
  settingsService.set(normalizedSettings);

  if (strapi.plugin("graphql")) {
    strapi.log.info("[fuzzy-search] graphql detected, registering queries");

    registerGraphlQLQuery(strapi);
  }
};
