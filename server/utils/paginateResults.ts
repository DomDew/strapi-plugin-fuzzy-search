import { PaginationBaseQuery } from '../config/querySchema';
import {
  PaginatedResultsResponse,
  RESTPaginationMeta,
  ResultsResponse,
} from '../interfaces/interfaces';
import { parsePagination } from './parsePagination';

export const paginateResults = async (
  pagination: Record<string, PaginationBaseQuery>,
  modelNames: string[],
  resultsResponse: ResultsResponse
) => {
  const currentResult = { ...resultsResponse };
  const paginatedResult: PaginatedResultsResponse<RESTPaginationMeta> = {};

  console.log(modelNames);

  const buildPaginatedResults = (modelName: string) => {
    const { page, pageSize, withCount } = parsePagination(
      pagination[modelName]
    );

    paginatedResult[modelName] = {
      data: [],
      meta: { pagination: { page: 0, pageSize: 25 } },
    };
    const startIndex = pageSize * (page - 1);
    const endIndex = startIndex + pageSize;

    paginatedResult[modelName].data = currentResult[modelName].slice(
      startIndex,
      endIndex
    );

    const meta: RESTPaginationMeta = {
      pagination: {
        page,
        pageSize,
      },
    };

    if (withCount) {
      const total = resultsResponse[modelName].length;
      meta.pagination.total = total;
      meta.pagination.pageCount = Math.ceil(total / pageSize);
    }

    paginatedResult[modelName].meta = meta;
  };

  modelNames.forEach((modelName) => {
    if (!pagination[modelName]) return;

    buildPaginatedResults(modelName);
  });

  return { ...resultsResponse, ...paginatedResult };
};
