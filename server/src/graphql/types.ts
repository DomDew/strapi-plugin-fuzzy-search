import { Core } from '@strapi/strapi';
import { pagination, errors } from '@strapi/utils';
import {
  ContentType,
  PaginationArgs,
  SearchResponseArgs,
  SearchResponseReturnType,
} from '../interfaces/interfaces';
import getResult from '../services/fuzzySearch-service';
import { buildGraphqlResponse } from '../services/response-transformation-service';
import settingsService from '../services/settings-service';
import { shouldIncludeMatches } from '../utils/shouldIncludeMatches';

interface NexusTypeBuilder {
  nonNull: NexusTypeBuilder;
  field: (name: string, config: NexusFieldConfig) => void;
  float: (name: string, config?: NexusFieldConfig) => void;
  list: NexusTypeBuilder;
  int: (name: string, config?: NexusFieldConfig) => void;
}

interface NexusFieldConfig {
  type?: string;
  args?: Record<string, unknown>;
  description?: string;
  resolve?: (parent: unknown, args: unknown, ctx: GraphQLContext) => unknown;
}

interface NexusObjectTypeConfig {
  name: string;
  description?: string;
  definition: (t: NexusTypeBuilder) => void;
}

interface NexusExtendTypeConfig {
  type: string;
  definition: (t: NexusTypeBuilder) => void;
}

interface NexusModule {
  objectType: (config: NexusObjectTypeConfig) => unknown;
  extendType: (config: NexusExtendTypeConfig) => unknown;
  nonNull: (arg: unknown) => unknown;
  stringArg: (description?: string) => unknown;
}

interface GraphQLContext {
  state: {
    auth?: Record<string, unknown>;
  };
  koaContext: {
    response: {
      message?: string;
    };
  };
}

interface EntityResponseCollectionParent {
  info?: {
    args?: {
      start?: number;
      limit?: number;
    };
    searchResultsTotal?: number;
  };
}

interface ContentTypeSearchArgs {
  pagination?: PaginationArgs;
  filters?: Record<string, unknown>;
  locale?: string;
  status?: 'published' | 'draft';
}

const getCustomTypes = (strapi: Core.Strapi, nexus: NexusModule) => {
  const { service: getService } = strapi.plugin('graphql');
  const { naming } = getService('utils');
  const { utils } = getService('builders');
  const config = settingsService().get();
  const { contentTypes } = config;
  const { getEntityResponseCollectionName, getFindQueryName, getTypeName } =
    naming;
  const { transformArgs, getContentTypeArgs } = utils;

  // Override pageInfo to use fuzzy search total instead of DB count
  const createEntityResponseCollectionExtension = (model: ContentType) => {
    const collectionTypeName = getEntityResponseCollectionName(model);

    return nexus.extendType({
      type: collectionTypeName,
      definition(t: NexusTypeBuilder) {
        t.nonNull.field('pageInfo', {
          type: 'Pagination',
          description: 'Pagination info based on fuzzy search results total',
          resolve: (parent: EntityResponseCollectionParent) => {
            const { args, searchResultsTotal } = parent.info ?? {};

            const { config: graphqlConfig } = strapi.plugin('graphql');
            const defaultLimit: number = graphqlConfig('defaultLimit') ?? 10;
            const start: number = args?.start ?? 0;
            const limit: number = args?.limit ?? defaultLimit;

            const total = searchResultsTotal ?? 0;

            return pagination.transformPagedPaginationInfo(
              { start, limit },
              total,
            );
          },
        });
      },
    });
  };

  const createSearchTypeExtension = (model: ContentType) => {
    return nexus.extendType({
      type: 'SearchResponse',
      definition(t: NexusTypeBuilder) {
        t.field(getFindQueryName(model), {
          type: getEntityResponseCollectionName(model),
          args: getContentTypeArgs(model, { multiple: true }),
          description: `Search results for ${model.modelName}`,
          resolve: async (
            parent: unknown,
            args: unknown,
            ctx: GraphQLContext,
          ) => {
            const typedParent = parent as SearchResponseReturnType;
            const typedArgs = args as ContentTypeSearchArgs;

            const { query, locale: parentLocaleQuery } = typedParent;
            const {
              pagination: paginationArgs,
              filters,
              locale: contentTypeLocaleQuery,
              status: contentTypeStatusQuery,
            } = typedArgs;

            const locale = contentTypeLocaleQuery ?? parentLocaleQuery;

            const {
              start: transformedStart,
              limit: transformedLimit,
              filters: transformedFilters,
            } = transformArgs(
              { pagination: paginationArgs, filters },
              {
                contentType: model,
                usePagination: true,
              },
            );

            const contentType = contentTypes.find(
              (ct) => ct.modelName === model.modelName,
            );

            if (!contentType) {
              throw new errors.NotFoundError(
                `Content type "${model.modelName}" is not configured for fuzzy search`,
              );
            }

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

            if (resultsResponse) {
              return resultsResponse;
            }

            throw new errors.ApplicationError(
              'Failed to build search response',
              {
                details: ctx.koaContext?.response?.message,
              },
            );
          },
        });
      },
    });
  };

  const fieldMatchResultType = nexus.objectType({
    name: 'FieldMatchResult',
    description: 'Match result details for a single searchable field',
    definition(t: NexusTypeBuilder) {
      t.float('score', {
        description:
          'Match score for this field (lower is better, -Infinity for exact match)',
      });
      t.list.int('indexes', {
        description: 'Character indexes where matches were found',
      });
    },
  });

  // Create matches type and meta type for each content type that has includeMatches enabled
  const contentTypeMatchesTypes = contentTypes
    .filter((contentType) => shouldIncludeMatches(contentType))
    .map((contentType) => {
      const entityTypeName = getTypeName(contentType);
      const matchesTypeName = `${entityTypeName}SearchMatches`;
      const metaTypeName = `${entityTypeName}FuzzySearchMeta`;

      const matchesType = nexus.objectType({
        name: matchesTypeName,
        description: `Match details for searchable fields in ${entityTypeName}`,
        definition(t: NexusTypeBuilder) {
          contentType.fuzzysortOptions.keys.forEach((key) => {
            t.field(key.name, {
              type: 'FieldMatchResult',
              description: `Match result for ${key.name} field`,
            });
          });
        },
      });

      const metaType = nexus.objectType({
        name: metaTypeName,
        description: `Search metadata for ${entityTypeName}`,
        definition(t: NexusTypeBuilder) {
          t.nonNull.float('score', {
            description: 'Overall match score (lower is better)',
          });
          t.field('matches', {
            type: matchesTypeName,
            description: 'Per-field match details',
          });
        },
      });

      return { matchesType, metaType, entityTypeName, metaTypeName };
    });

  const entityTypeExtensions = contentTypeMatchesTypes.map(
    ({ entityTypeName, metaTypeName }) => {
      strapi.log.info(
        `[fuzzy-search] Registering searchMeta field for ${entityTypeName}`,
      );

      return nexus.extendType({
        type: entityTypeName,
        definition(t: NexusTypeBuilder) {
          t.field('searchMeta', {
            type: metaTypeName,
            description:
              'Fuzzy search match metadata (only present in search results)',
            resolve: (parent: unknown) => {
              const typedParent = parent as { searchMeta?: unknown };
              return typedParent.searchMeta;
            },
          });
        },
      });
    },
  );

  const searchQueryExtension = nexus.extendType({
    type: 'Query',
    definition(t: NexusTypeBuilder) {
      t.field('search', {
        type: 'SearchResponse',
        description: 'Perform a fuzzy search across configured content types',
        args: {
          query: nexus.nonNull(
            nexus.stringArg('The query string to search for'),
          ),
          locale: nexus.stringArg('Filter results by locale'),
        },
        resolve: async (
          _parent: unknown,
          args: unknown,
          ctx: GraphQLContext,
        ): Promise<SearchResponseReturnType> => {
          const { query, locale } = args as SearchResponseArgs;
          const { auth } = ctx.state;

          return { query, locale, auth: auth ?? {} };
        },
      });
    },
  });

  const contentTypeExtensions = contentTypes.flatMap((type) => [
    createSearchTypeExtension(type),
    createEntityResponseCollectionExtension(type),
  ]);

  const allMatchesAndMetaTypes = contentTypeMatchesTypes.flatMap((ct) => [
    ct.matchesType,
    ct.metaType,
  ]);

  return [
    fieldMatchResultType,
    ...allMatchesAndMetaTypes,
    searchQueryExtension,
    ...entityTypeExtensions,
    ...contentTypeExtensions,
  ];
};

export default getCustomTypes;
