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

const getCustomTypes = (strapi: Strapi, nexus) => {
  const { service: getService } = strapi.plugin('graphql');
  const { naming } = getService('utils');
  const { contentTypes } = settingsService().get();
  const { getEntityResponseCollectionName, getFindQueryName } = naming;

  // Extend the SearchResponse type for each registered model
  const extendSearchType = (nexus, model: ModelType) => {
    return nexus.extendType({
      type: 'SearchResponse',
      definition(t) {
        t.field(getFindQueryName(model), {
          type: getEntityResponseCollectionName(model),
          args: {
            pagination: nexus.arg({ type: 'PaginationArg' }),
          },
          async resolve(
            parent: SearchResponseReturnType,
            args: { pagination?: PaginationArgs },
            ctx,
            auth: Record<string, unknown>
          ) {
            const { query, locale } = parent;
            const { pagination } = args;

            const contentType = contentTypes.find(
              (contentType) => contentType.modelName === model.modelName
            );

            const searchResult = await getResult(contentType, query, locale);

            const resultsResponse = await buildGraphqlResponse(
              searchResult,
              auth,
              pagination
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
