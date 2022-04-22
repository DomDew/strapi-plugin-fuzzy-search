"use strict";

const { pluginConfigSchema } = require("./schema");

module.exports = {
  default() {
    return {
      contentTypes: {},
    };
  },
  async validator(config) {
    await pluginConfigSchema.validate(config);
  },
};
