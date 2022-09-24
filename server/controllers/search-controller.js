const { getPluginService } = require('../utils/getPluginService');
const { NotFoundError } = require('@strapi/utils/lib/errors');
const { sanitizeOutput } = require('../utils/sanitizeOutput');

module.exports = ({ strapi }) => ({
  async search(ctx) {
    const query = ctx.query.query;
    const locale = ctx.query.locale;
    const { auth } = ctx.state;

    const searchResults = await getPluginService(
      strapi,
      'fuzzySearchService'
    ).getResults(query, locale);

    const resultsResponse = {};

    // Build resultsResponse with sanitized entities
    // Since sanitizeOutput returns a promise --> Resolve all promises in async forEach so mapping works as expected
    searchResults.forEach(async (res) => {
      resultsResponse[res.pluralName] = await Promise.all(
        res.fuzzysortResults.map(async (fuzzyRes) => {
          const sanitizedEntity = await sanitizeOutput(
            fuzzyRes.obj,
            res.contentType,
            auth
          );

          return sanitizedEntity;
        })
      );
    });

    if (resultsResponse) {
      return resultsResponse;
    } else {
      throw new NotFoundError();
    }
  },
});
