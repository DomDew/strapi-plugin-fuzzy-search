/* eslint-disable @typescript-eslint/no-explicit-any */
import { Core } from '@strapi/strapi';
import {
  ContentType,
  PaginationArgs,
  SearchResponseArgs,
  SearchResponseReturnType,
} from '../interfaces/interfaces';
import getResult from '../services/fuzzySearch-service';
import { buildGraphqlResponse } from '../services/response-transformation-service';
import settingsService from '../services/settings-service';

const getCustomTypes = (strapi: Core.Strapi, nexus: any) => {
  const { service: getService } = strapi.plugin('graphql');
  const { naming } = getService('utils');
  const { utils } = getService('builders');
  const { contentTypes } = settingsService().get();
  const { getEntityResponseCollectionName, getFindQueryName } = naming;
  const { transformArgs, getContentTypeArgs } = utils;

  // Extend the SearchResponse type for each registered model
  const extendSearchType = (nexus: any, model: ContentType) => {
    return nexus.extendType({
      type: 'SearchResponse',
      definition(t: any) {
        t.field(getFindQueryName(model), {
          type: getEntityResponseCollectionName(model),
          args: getContentTypeArgs(model, { multiple: true }),
          async resolve(
            parent: SearchResponseReturnType,
            args: {
              pagination?: PaginationArgs;
              filters?: Record<string, unknown>;
              locale?: string;
              status?: 'published' | 'draft';
            },
            ctx: any,
          ) {
            const { query, locale: parentLocaleQuery } = parent;
            const {
              pagination,
              filters,
              locale: contentTypeLocaleQuery,
              status: contentTypeStatusQuery,
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

            const results = await getResult({
              contentType,
              query,
              filters: transformedFilters,
              populate: undefined,
              locale,
              status: contentTypeStatusQuery,
            });

            const resultsResponse = await buildGraphqlResponse(
              results.fuzzysortResults,
              contentType,
              ctx.state?.auth,
              { start: transformedStart, limit: transformedLimit },
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
