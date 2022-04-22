"use strict";

const _ = require("lodash");
const { pluginId } = require("../utils/pluginId");

module.exports = ({ strapi }) => ({
  get() {
    return strapi.config.get(`plugin.${pluginId}`);
  },
  set(settings) {
    return strapi.config.set(`plugin.${pluginId}`, settings);
  },
  build(settings) {
    settings.contentTypes.forEach((contentType) => {
      contentType.model = strapi.contentTypes[contentType.uid];
    });

    return settings;
  },
});
