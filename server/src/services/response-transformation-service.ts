import { Model } from '@strapi/utils/dist/types';
import { PaginationBaseQuery } from '../config/query.schema';
import {
  ContentType,
  Entry,
  FieldMatchResult,
  Result,
  ResultsResponse,
  SearchMeta,
  TransformedPagination,
} from '../interfaces/interfaces';
import { shouldIncludeMatches } from '../utils/shouldIncludeMatches';
import {
  paginateGraphQlResults,
  paginateRestResults,
} from './pagination-service';

const sanitizeOutput = (data: unknown, schema: Model, auth: unknown) =>
  strapi.contentAPI.sanitize.output(data, schema, { auth });

const extractSearchMeta = (
  fuzzyRes: Fuzzysort.KeysResult<Entry>,
  contentType: ContentType,
): SearchMeta => {
  const matches: Record<string, FieldMatchResult> = {};

  contentType.fuzzysortOptions.keys.forEach((key, index) => {
    const keyResult = fuzzyRes[index];
    matches[key.name] = {
      score: keyResult ? keyResult.score : null,
      indexes: keyResult ? keyResult.indexes : null,
    };
  });

  return {
    score: fuzzyRes.score,
    matches,
  };
};

// Destructure search results and return them in appropriate/sanitized format
export const buildGraphqlResponse = async (
  searchResult: Fuzzysort.KeysResults<Entry>,
  schema: ContentType,
  auth: Record<string, unknown>,
  pagination: TransformedPagination,
) => {
  const includeMatches = shouldIncludeMatches(schema);

  const results = await Promise.all(
    searchResult.map(async (fuzzyRes) => {
      const sanitized = (await sanitizeOutput(
        fuzzyRes.obj,
        schema,
        auth,
      )) as Record<string, unknown>;

      if (includeMatches) {
        const searchMeta = extractSearchMeta(fuzzyRes, schema);
        return { ...sanitized, searchMeta };
      }

      return sanitized;
    }),
  );

  const { data: nodes, meta } = paginateGraphQlResults(results, pagination);

  // Build response manually to preserve searchResultsTotal
  return {
    nodes,
    info: {
      args: meta,
      resourceUID: schema.uid,
      searchResultsTotal: meta.total,
    },
  };
};

export const buildRestResponse = async (
  searchResults: Result[],
  auth: unknown,
  pagination?: Record<string, PaginationBaseQuery>,
  queriedContentTypes?: string[],
) => {
  const resultsResponse: ResultsResponse = {};

  for (const res of searchResults) {
    const includeMatches = shouldIncludeMatches(res.schema);

    const sanitizeEntry = async (fuzzyRes: Fuzzysort.KeysResult<Entry>) => {
      const sanitized = (await sanitizeOutput(
        fuzzyRes.obj,
        res.schema,
        auth,
      )) as Record<string, unknown>;

      if (includeMatches) {
        const searchMeta = extractSearchMeta(fuzzyRes, res.schema);
        return { ...sanitized, searchMeta };
      }

      return sanitized;
    };

    const buildSanitizedEntries = async () =>
      res.fuzzysortResults.map(
        async (fuzzyRes) => await sanitizeEntry(fuzzyRes),
      );

    // Since sanitizeOutput returns a promise --> Resolve all promises in async for loop so that results can be awaited correctly
    resultsResponse[res.schema.info.pluralName] = (await Promise.all(
      await buildSanitizedEntries(),
    )) as Array<Record<string, unknown>>;
  }

  if (!pagination) return resultsResponse;

  const modelNames = queriedContentTypes || Object.keys(pagination);
  return await paginateRestResults(pagination, modelNames, resultsResponse);
};

export default buildRestResponse;
