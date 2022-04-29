"use strict";

const searchRoutes = require("./search-routes");

module.exports = {
  "content-api": {
    type: "content-api",
    routes: searchRoutes,
  },
};
