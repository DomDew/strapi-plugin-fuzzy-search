import { Result, TransformedPagination } from '../interfaces/interfaces';
import { paginateGraphQlResults } from './paginateGraphQlResults';
import sanitizeOutput from './sanitizeOutput';

// Destructure search results and return them in appropriate/sanitized format
const buildGraphqlResponse = async (
  searchResult: Result,
  auth: Record<string, unknown>,
  pagination?: TransformedPagination
) => {
  const { service: getService } = strapi.plugin('graphql');
  const { returnTypes } = getService('format');
  const { toEntityResponseCollection } = returnTypes;
  const { fuzzysortResults, uid } = searchResult;

  const results = await Promise.all(
    fuzzysortResults.map(async (fuzzyRes) => {
      const schema = strapi.getModel(uid);

      const sanitizedEntity: Record<string, unknown> = (await sanitizeOutput(
        fuzzyRes.obj,
        schema,
        auth
      )) as Record<string, unknown>;

      return sanitizedEntity;
    })
  );

  const { data: nodes, meta } = paginateGraphQlResults(results, pagination);
  return toEntityResponseCollection(nodes, {
    args: meta,
    resourceUID: uid,
  });
};

export default buildGraphqlResponse;
