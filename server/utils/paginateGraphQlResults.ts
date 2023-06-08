import {
  PaginatedModelResponse,
  PaginationArgs,
  PaginationMeta,
} from '../interfaces/interfaces';

export const paginateGraphQlResults = (
  results: Record<string, unknown>[],
  { limit, start }: PaginationArgs = {}
): PaginatedModelResponse => {
  const resultsCopy = [...results];

  const data = resultsCopy.slice(start, start + limit);

  // Strapi only accepts start and limit at meta args
  // and calculates values in toEntityResponseCollection() util
  const meta: PaginationMeta = {
    start,
    limit,
  };

  return { data, meta };
};
