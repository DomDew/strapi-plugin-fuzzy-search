import { NotFoundError } from '@strapi/utils/lib/errors';
import { ValidationError } from 'yup';
import { Context } from '../interfaces/interfaces';
import getResults from '../services/fuzzySearchService';
import settingsService from '../services/settingsService';
import buildRestResponse from '../utils/buildRestResponse';
import { validateQueryParams } from '../utils/validateQueryParams';

export default () => ({
  async search(ctx: Context) {
    const { contentTypes } = settingsService().get();
    const { query, locale, pagination, filters } = ctx.query;
    const { auth } = ctx.state;

    try {
      await validateQueryParams(ctx.query, contentTypes, pagination);
    } catch (err) {
      return ctx.badRequest('Invalid query', err.message);
    }

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
