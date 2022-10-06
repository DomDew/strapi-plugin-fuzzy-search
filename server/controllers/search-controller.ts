import { NotFoundError } from '@strapi/utils/lib/errors';
import fuzzySearchService from '../services/fuzzySearchService';
import buildRestResponse from '../utils/buildRestResponse';

export default () => ({
  async search(ctx) {
    const query = ctx.query.query;
    const locale = ctx.query.locale;
    const { auth } = ctx.state;

    const searchResults = await fuzzySearchService().getResults(query, locale);

    const response = await buildRestResponse(searchResults, auth);

    if (response) {
      return response;
    } else {
      throw new NotFoundError();
    }
  },
});
