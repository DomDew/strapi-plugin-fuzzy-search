const { getPluginService } = require("../utils/getPluginService");
const { NotFoundError } = require("@strapi/utils/lib/errors");
const { sanitizeOutput } = require("../utils/sanitizeOutput");

module.exports = ({ strapi }) => ({
  async search(ctx) {
    const query = ctx.query.query;
    const locale = ctx.query.locale;
    const limit = ctx.query.limit;
    const { auth } = ctx.state;

    const searchResults = await getPluginService(
      strapi,
      "fuzzySearchService",
      limit
    ).getResults(query, locale);

    const resultsResponse = {};

    // Build resultsResponse with sanitized entities
    // Since sanitizeOutput returns a promise --> Resolve all promises in async forEach so mapping works as expected
    searchResults.forEach(async (res) => {
      resultsResponse[res.pluralName] = await Promise.all(
        res.fuzzysort.map(async (fuzzyRes) => {
          const sanitizedEntity = await sanitizeOutput(
            fuzzyRes.obj,
            res.contentType,
            auth
          );

          return sanitizedEntity;
        })
      );
    });

    /**
     * Error handling
     * TODO: Implement error handling
     * TODO: Locale==null Handling
     */
    if (resultsResponse) {
      return resultsResponse;
    } else {
      throw new NotFoundError();
    }
  },
});
