// Destructure search results and return them in appropriate/sanitized format
const buildGraphqlResponse = async (searchResults, auth) => {
  const { sanitizeOutput } = require('../utils/sanitizeOutput');
  const { getPluginService } = require('../utils/getPluginService');
  const { toEntityResponseCollection } = getPluginService(
    strapi,
    'format',
    'graphql'
  ).returnTypes;

  const resultsResponse = {};

  // Map over results instead of using for each so promises can be resolved
  // and thus resultsResponse can be build properly
  await Promise.all(
    searchResults.map(async (res) => {
      resultsResponse[res.pluralName] = toEntityResponseCollection(
        res.fuzzysortResults.map(async (fuzzyRes) => {
          const sanitizedEntity = await sanitizeOutput(
            fuzzyRes.obj,
            res.contentType,
            auth
          );

          return sanitizedEntity;
        })
      );
    })
  );

  return resultsResponse;
};

module.exports = {
  buildGraphqlResponse,
};
