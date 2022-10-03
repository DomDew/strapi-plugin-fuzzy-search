import { NotFoundError } from '@strapi/utils/lib/errors';
import fuzzySearchService from '../services/fuzzySearchService';
import sanitizeOutput from '../utils/sanitizeOutput';

export default () => ({
  async search(ctx) {
    const query = ctx.query.query;
    const locale = ctx.query.locale;
    const { auth } = ctx.state;

    const searchResults = await fuzzySearchService().getResults(query, locale);

    const resultsResponse = {};

    // Build resultsResponse with sanitized entities
    // Since sanitizeOutput returns a promise --> Resolve all promises in async forEach so mapping works as expected
    searchResults.forEach(async (res) => {
      resultsResponse[res.pluralName] = await Promise.all(
        res.fuzzysortResults.map(async (fuzzyRes) => {
          const schema = strapi.getModel(res.uid);

          const sanitizedEntity = await sanitizeOutput(
            fuzzyRes.obj,
            schema,
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
