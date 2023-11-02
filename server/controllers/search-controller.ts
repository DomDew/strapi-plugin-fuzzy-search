import { errors } from '@strapi/utils';
import { Context, Result } from '../interfaces/interfaces';
import getResult from '../services/fuzzySearchService';
import buildRestResponse from '../services/responseTransformationService';
import settingsService from '../services/settingsService';
import { validateQueryParams } from '../services/validationService';

const { NotFoundError } = errors;

export default () => ({
  async search(ctx: Context) {
    const { contentTypes } = settingsService().get();
    const { query, pagination, filters: filtersQuery, locale } = ctx.query;
    const { auth } = ctx.state;

    const queriedContentTypes =
      filtersQuery && filtersQuery.contentTypes
        ? filtersQuery.contentTypes?.split(',')
        : undefined;

    try {
      await validateQueryParams(
        ctx.query,
        contentTypes,
        pagination,
        queriedContentTypes,
      );
    } catch (err: unknown) {
      let message = 'unknown error';
      if (err instanceof Error) message = err.message;

      return ctx.badRequest('Invalid query', message);
    }

    const queriedContentTypesSet = new Set(queriedContentTypes);

    const filteredContentTypes = filtersQuery?.contentTypes
      ? [...contentTypes].filter((contentType) =>
          queriedContentTypesSet.has(contentType.info.pluralName),
        )
      : contentTypes;

    const results: Result[] = await Promise.all(
      filteredContentTypes.map(
        async (contentType) =>
          await getResult(
            contentType,
            query,
            filtersQuery?.[contentType.info.pluralName],
            filtersQuery?.[contentType.info.pluralName]?.locale || locale,
          ),
      ),
    );

    const response = await buildRestResponse(
      results,
      auth,
      pagination,
      queriedContentTypes,
    );

    if (response) {
      return response;
    } else {
      throw new NotFoundError();
    }
  },
});
