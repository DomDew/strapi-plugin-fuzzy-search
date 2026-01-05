import { errors } from '@strapi/utils';
import { Context, Result } from '../interfaces/interfaces';
import getResult from '../services/fuzzySearch-service';
import buildRestResponse from '../services/response-transformation-service';
import settingsService from '../services/settings-service';
import { validateQueryParams } from '../services/validation-service';

const { NotFoundError } = errors;

export default () => ({
  async search(ctx: Context) {
    const { contentTypes } = settingsService().get();
    const {
      query,
      pagination,
      filters: filtersQuery,
      locale,
      populate,
      status: statusQuery,
    } = ctx.query;
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
        populate,
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
          await getResult({
            contentType,
            query,
            filters: filtersQuery?.[contentType.info.pluralName],
            populate: populate?.[contentType.info.pluralName],
            locale:
              filtersQuery?.[contentType.info.pluralName]?.locale || locale,
            status: statusQuery?.[contentType.info.pluralName] || "published",
          }),
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
