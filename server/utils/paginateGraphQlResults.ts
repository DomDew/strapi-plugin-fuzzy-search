import {
  PaginatedModelResponse,
  PaginationArgs,
  PaginationMeta,
} from '../interfaces/interfaces';

export const paginateGraphQlResults = (
  results: Record<string, unknown>[],
  pagination?: PaginationArgs
): PaginatedModelResponse => {
  const resultsCopy = [...results];

  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 10;

  const startIndex = pageSize * (page - 1);
  const endIndex = startIndex + pageSize;

  const data = resultsCopy.slice(startIndex, endIndex);

  // Strapi only accepts start and limit at meta args
  // and calculates values in toEntityResponseCollection() util
  const meta: PaginationMeta = {
    start: startIndex,
    limit: pageSize,
  };

  return { data, meta };
};
