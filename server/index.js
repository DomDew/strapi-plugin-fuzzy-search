"use strict";

const bootstrap = require("./bootstrap");
const register = require("./register");
const destroy = require("./destroy");
const config = require("./config");
const services = require("./services");

module.exports = {
  bootstrap,
  register,
  destroy,
  config,
  services,
};
