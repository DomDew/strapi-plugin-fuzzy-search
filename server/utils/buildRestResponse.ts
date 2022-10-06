import { Result } from '../interfaces/interfaces';
import sanitizeOutput from './sanitizeOutput';

// Since sanitizeOutput returns a promise --> Resolve all promises in async for loop so that results can be awaited correctly
const buildRestResponse = async (searchResults: Result[], auth: any) => {
  const resultsResponse = {};

  for (const res of searchResults) {
    resultsResponse[res.pluralName] = await Promise.all(
      res.fuzzysortResults.map(async (fuzzyRes) => {
        const schema = strapi.getModel(res.uid);

        const sanitizedEntity = await sanitizeOutput(
          fuzzyRes.obj,
          schema,
          auth
        );

        return sanitizedEntity;
      })
    );
  }

  return resultsResponse;
};

export default buildRestResponse;
