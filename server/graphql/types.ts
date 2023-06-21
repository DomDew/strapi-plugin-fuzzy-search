import { Strapi } from '@strapi/strapi';
import {
  ModelType,
  PaginationArgs,
  SearchResponseArgs,
  SearchResponseReturnType,
} from '../interfaces/interfaces';
import getResult from '../services/fuzzySearchService';
import settingsService from '../services/settingsService';
import buildGraphqlResponse from '../utils/buildGraphqlResponse';
import { getTransformedUserPaginationInput } from '../utils/getTransformedGraphqlPaginationInput';

const getCustomTypes = (strapi: Strapi, nexus) => {
  const { service: getService } = strapi.plugin('graphql');
  const { naming } = getService('utils');
  const { utils } = getService('builders');
  const { contentTypes } = settingsService().get();
  const {
    getEntityResponseCollectionName,
    getFindQueryName,
    getFiltersInputTypeName,
  } = naming;
  const { transformArgs } = utils;

  // Extend the SearchResponse type for each registered model
  const extendSearchType = (nexus, model: ModelType) => {
    return nexus.extendType({
      type: 'SearchResponse',
      definition(t) {
        t.field(getFindQueryName(model), {
          type: getEntityResponseCollectionName(model),
          args: {
            pagination: nexus.arg({ type: 'PaginationArg' }),
            filters: nexus.arg({ type: getFiltersInputTypeName(model) }),
            locale: nexus.arg({ type: 'I18NLocaleCode' }),
          },
          async resolve(
            parent: SearchResponseReturnType,
            args: {
              pagination?: PaginationArgs;
              filters?: Record<string, unknown>;
              locale?: string;
            },
            ctx,
            auth: Record<string, unknown>
          ) {
            const { query } = parent;
            const { pagination, filters, locale } = args;

            const { start, limit } =
              getTransformedUserPaginationInput(pagination);

            const {
              start: transformedStart,
              limit: transformedLimit,
              filters: transformedFilters,
            } = transformArgs(
              { pagination: { start, limit }, filters },
              {
                contentType: model,
                usePagination: true,
              }
            );

            const contentType = contentTypes.find(
              (contentType) => contentType.modelName === model.modelName
            );

            const searchResult = await getResult(
              contentType,
              query,
              transformedFilters ||
                contentType.queryConstraints?.where ||
                contentType.queryConstraints,
              locale
            );

            const resultsResponse = await buildGraphqlResponse(
              searchResult,
              auth,
              { start: transformedStart, limit: transformedLimit }
            );

            if (resultsResponse) return resultsResponse;

            throw new Error(ctx.koaContext.response.message);
          },
        });
      },
    });
  };

  const searchResponseType = nexus.extendType({
    type: 'Query',
    definition(t) {
      t.field('search', {
        type: 'SearchResponse',
        args: {
          query: nexus.nonNull(
            nexus.stringArg('The query string by which the models are searched')
          ),
          locale: nexus.stringArg('The locale by which to filter the models'),
        },
        async resolve(
          _parent,
          args: SearchResponseArgs,
          ctx
        ): Promise<SearchResponseReturnType> {
          // Destructure the args to get query value
          const { query, locale } = args;
          const { auth } = ctx.state;

          return { query, locale, auth };
        },
      });
    },
  });

  const returnTypes = [searchResponseType];

  contentTypes.forEach((type) => {
    returnTypes.unshift(extendSearchType(nexus, type.model));
  });

  return returnTypes;
};

export default getCustomTypes;
