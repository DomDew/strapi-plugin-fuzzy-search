import { NotFoundError } from '@strapi/utils/lib/errors';
import { PaginationQuery } from '../interfaces/interfaces';
import fuzzySearchService from '../services/fuzzySearchService';
import buildRestResponse from '../utils/buildRestResponse';

export default () => ({
  async search(ctx) {
    const query = ctx.query.query;
    const locale = ctx.query.locale;
    const pagination = ctx.query.pagination as PaginationQuery;
    const { auth } = ctx.state;

    const searchResults = await fuzzySearchService().getResults(query, locale);

    const response = await buildRestResponse(searchResults, auth, pagination);

    if (response) {
      return response;
    } else {
      throw new NotFoundError();
    }
  },
});
