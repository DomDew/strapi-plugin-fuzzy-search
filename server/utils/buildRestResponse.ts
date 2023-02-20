import {
  PaginationQuery,
  Result,
  ResultsResponse,
} from '../interfaces/interfaces';
import { paginateResults } from './paginateResults';
import sanitizeOutput from './sanitizeOutput';

// Since sanitizeOutput returns a promise --> Resolve all promises in async for loop so that results can be awaited correctly
const buildRestResponse = async (
  searchResults: Result[],
  auth: any,
  pagination: PaginationQuery
) => {
  const resultsResponse: ResultsResponse = {};

  for (const res of searchResults) {
    const sanitizeEntry = async (fuzzyRes) => {
      const schema = strapi.getModel(res.uid);

      const sanitizedEntity = await sanitizeOutput(fuzzyRes.obj, schema, auth);

      return sanitizedEntity;
    };

    const buildSanitizedEntries = async () =>
      res.fuzzysortResults.map(
        async (fuzzyRes) => await sanitizeEntry(fuzzyRes)
      );

    resultsResponse[res.pluralName] = await Promise.all(
      await buildSanitizedEntries()
    );
  }

  return paginateResults(pagination, resultsResponse);
};

export default buildRestResponse;
