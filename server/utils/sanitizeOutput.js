const { contentAPI } = require("@strapi/utils/lib/sanitize");

const sanitizeOutput = (data, contentType, auth) =>
  contentAPI.output(data, contentType, { auth });

module.exports = {
  sanitizeOutput,
};
