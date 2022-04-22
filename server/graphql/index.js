"use strict";

const { getCustomTypes } = require("./types");
const { getResolversConfig } = require("./resolversConfig");
const { getPluginService } = require("../utils/getPluginService");

const registerGraphlQLQuery = (strapi) => {
  // build plugins schema extension
  const extension = ({ nexus }) => ({
    types: getCustomTypes(strapi, nexus),
    resolversConfig: getResolversConfig(),
  });

  getPluginService(strapi, "extension", "graphql").use(extension);
};

module.exports = {
  registerGraphlQLQuery,
};
