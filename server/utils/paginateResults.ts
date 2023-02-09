import {
  PaginatedResultsResponse,
  PaginationMeta,
  PaginationQuery,
  ResultsResponse,
} from '../interfaces/interfaces';
import { parsePagination } from './parsePagination';

export const paginateResults = (
  pagination: PaginationQuery,
  resultsResponse: ResultsResponse
) => {
  const resultsCopy = { ...resultsResponse };
  const paginatedResult: PaginatedResultsResponse = {};

  const modelNames = Object.keys(pagination);

  const buildPaginatedResults = (modelName: string) => {
    const { page, pageSize, withCount } = parsePagination(
      pagination[modelName]
    );

    paginatedResult[modelName] = { data: [] };

    const startIndex = pageSize * (page - 1);
    const endIndex = startIndex + pageSize;

    paginatedResult[modelName].data = resultsCopy[modelName].slice(
      startIndex,
      endIndex
    );

    const meta: { pagination: PaginationMeta } = {
      pagination: {
        page: page,
        pageSize: pageSize,
      },
    };

    if (withCount) {
      const total = resultsResponse[modelName].length;

      meta.pagination.total = total;
      meta.pagination.pageCount = Math.ceil(total / pageSize);
    }

    console.log(paginatedResult[modelName].data);

    paginatedResult[modelName].meta = meta;
  };

  modelNames.forEach((modelName) => buildPaginatedResults(modelName));

  return paginatedResult;
};
