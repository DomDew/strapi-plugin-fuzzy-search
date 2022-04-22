"use strict";

const { registerGraphlQLQuery } = require("./graphql");

module.exports = ({ strapi }) => {
  if (strapi.plugin("graphql")) {
    strapi.log.info("[fuzzy-search] graphql detected, registering queries");
    registerGraphlQLQuery(strapi);
  }
};
