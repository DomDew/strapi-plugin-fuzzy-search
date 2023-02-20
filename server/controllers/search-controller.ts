import { NotFoundError } from '@strapi/utils/lib/errors';
import { Context } from '../interfaces/interfaces';
import getResults from '../services/fuzzySearchService';
import settingsService from '../services/settingsService';
import buildRestResponse from '../utils/buildRestResponse';

export default () => ({
  async search(ctx: Context) {
    const { query, locale, pagination, filters } = ctx.query;

    const { auth } = ctx.state;
    const { contentTypes } = settingsService().get();

    const results = await Promise.all(
      contentTypes.map(
        async (contentType) => await getResults(contentType, query, locale)
      )
    );

    const response = await buildRestResponse(results, auth, pagination);

    if (response) {
      return response;
    } else {
      throw new NotFoundError();
    }
  },
});
