import { errors } from '@strapi/utils';
import { Context } from '../interfaces/interfaces';
import getResults from '../services/fuzzySearchService';
import settingsService from '../services/settingsService';
import buildRestResponse from '../utils/buildRestResponse';
import { validateQueryParams } from '../utils/validateQueryParams';

const { NotFoundError } = errors;

export default () => ({
  async search(ctx: Context) {
    const { contentTypes } = settingsService().get();
    const { query, pagination, filters: filtersQuery, locale } = ctx.query;
    const { auth } = ctx.state;

    const queriedContentTypes =
      filtersQuery && filtersQuery.contentTypes
        ? filtersQuery.contentTypes?.split(',')
        : null;

    try {
      await validateQueryParams(
        ctx.query,
        contentTypes,
        pagination,
        queriedContentTypes
      );
    } catch (err) {
      return ctx.badRequest('Invalid query', err.message);
    }

    const queriedContentTypesSet = new Set(queriedContentTypes);

    const filteredContentTypes = filtersQuery?.contentTypes
      ? [...contentTypes].filter((contentType) =>
          queriedContentTypesSet.has(contentType.model.info.pluralName)
        )
      : contentTypes;

    const results = await Promise.all(
      filteredContentTypes.map(async (contentType) => {
        return await getResults(
          contentType,
          query,
          (filtersQuery && filtersQuery[contentType.model.info.pluralName]) ||
            contentType.queryConstraints?.where ||
            contentType.queryConstraints,
          locale
        );
      })
    );

    const response = await buildRestResponse(
      results,
      auth,
      pagination,
      queriedContentTypes
    );

    if (response) {
      return response;
    } else {
      throw new NotFoundError();
    }
  },
});
