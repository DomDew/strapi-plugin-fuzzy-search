/* eslint-disable @typescript-eslint/no-explicit-any */
import { Strapi } from '@strapi/strapi';
import {
  ContentType,
  PaginationArgs,
  SearchResponseArgs,
  SearchResponseReturnType,
} from '../interfaces/interfaces';
import getResult from '../services/fuzzySearch-service';
import { buildGraphqlResponse } from '../services/response-transformation-service';
import settingsService from '../services/settings-service';

const getCustomTypes = (strapi: Strapi, nexus: any) => {
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
  const extendSearchType = (nexus: any, model: ContentType) => {
    return nexus.extendType({
      type: 'SearchResponse',
      definition(t: any) {
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
            ctx: any,
            auth: Record<string, unknown>,
          ) {
            const { query, locale: parentLocaleQuery } = parent;
            const {
              pagination,
              filters,
              locale: contentTypeLocaleQuery,
            } = args;

            const locale = contentTypeLocaleQuery || parentLocaleQuery;

            const {
              start: transformedStart,
              limit: transformedLimit,
              filters: transformedFilters,
            } = transformArgs(
              { pagination, filters },
              {
                contentType: model,
                usePagination: true,
              },
            );

            const contentType = contentTypes.find(
              (contentType) => contentType.modelName === model.modelName,
            );

            if (!contentType) return;

            const results = await getResult(
              contentType,
              query,
              transformedFilters,
              locale,
            );

            const resultsResponse = await buildGraphqlResponse(
              results.fuzzysortResults,
              contentType,
              auth,
              { start: transformedStart, limit: transformedLimit },
            );

            console.log(resultsResponse);

            if (resultsResponse) return resultsResponse;

            throw new Error(ctx.koaContext.response.message);
          },
        });
      },
    });
  };

  const searchResponseType = nexus.extendType({
    type: 'Query',
    definition(t: any) {
      t.field('search', {
        type: 'SearchResponse',
        args: {
          query: nexus.nonNull(
            nexus.stringArg(
              'The query string by which the models are searched',
            ),
          ),
          locale: nexus.stringArg('The locale by which to filter the models'),
        },
        async resolve(
          _parent: any,
          args: SearchResponseArgs,
          ctx: any,
        ): Promise<SearchResponseReturnType> {
          const { query, locale } = args;
          const { auth } = ctx.state;

          return { query, locale, auth };
        },
      });
    },
  });

  const returnTypes = [searchResponseType];

  contentTypes.forEach((type) => {
    returnTypes.unshift(extendSearchType(nexus, type));
  });

  return returnTypes;
};

export default getCustomTypes;
