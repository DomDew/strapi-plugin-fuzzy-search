import { PaginationBaseQuery } from '../config/querySchema';
import { Entity, Result, ResultsResponse } from '../interfaces/interfaces';
import { paginateResults } from './paginateResults';
import sanitizeOutput from './sanitizeOutput';

const buildRestResponse = async (
  searchResults: Result[],
  auth: any,
  pagination: Record<string, PaginationBaseQuery> | null,
  queriedContentTypes?: string[]
) => {
  const resultsResponse: ResultsResponse = {};

  for (const res of searchResults) {
    const sanitizeEntry = async (fuzzyRes: Fuzzysort.KeysResult<Entity>) => {
      const schema = strapi.getModel(res.uid);

      return await sanitizeOutput(fuzzyRes.obj, schema, auth);
    };

    const buildSanitizedEntries = async () =>
      res.fuzzysortResults.map(
        async (fuzzyRes) => await sanitizeEntry(fuzzyRes)
      );

    // Since sanitizeOutput returns a promise --> Resolve all promises in async for loop so that results can be awaited correctly
    resultsResponse[res.pluralName] = await Promise.all(
      await buildSanitizedEntries()
    );
  }

  if (!pagination) return resultsResponse;

  const modelNames = queriedContentTypes || Object.keys(pagination);
  return await paginateResults(pagination, modelNames, resultsResponse);
};

export default buildRestResponse;
