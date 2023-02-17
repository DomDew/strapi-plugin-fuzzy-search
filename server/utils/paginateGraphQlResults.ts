import {
  PaginatedModelResponse,
  PaginationArgs,
  PaginationMeta,
} from '../interfaces/interfaces';

export const paginateGraphQlResults = (
  results: Record<string, unknown>[],
  { page = 1, pageSize, limit = 10, start }: PaginationArgs
): PaginatedModelResponse => {
  const resultsCopy = [...results];

  const userLimit = pageSize || limit;

  const startIndex =
    start || start !== undefined ? start : userLimit * (page - 1);
  const endIndex = start ? start + userLimit : startIndex + userLimit;

  const data = resultsCopy.slice(startIndex, endIndex);

  // Strapi only accepts start and limit at meta args
  // and calculates values in toEntityResponseCollection() util
  const meta: PaginationMeta = {
    start: startIndex,
    limit: userLimit,
  };

  return { data, meta };
};
