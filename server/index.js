"use strict";

const bootstrap = require("./bootstrap");
const register = require("./register");
const config = require("./config");
const services = require("./services");
const controllers = require("./controllers");
const routes = require("./routes");

module.exports = {
  bootstrap,
  register,
  config,
  services,
  controllers,
  routes,
};
