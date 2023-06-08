import { PaginationBaseQuery } from '../config/querySchema';
import {
  PaginatedResultsResponse,
  RESTPaginationMeta,
  ResultsResponse,
} from '../interfaces/interfaces';
import { parsePagination } from './parsePagination';

export const paginateResults = async (
  pagination: Record<string, PaginationBaseQuery>,
  pluralNames: string[],
  resultsResponse: ResultsResponse
) => {
  const currentResult = { ...resultsResponse };
  const paginatedResult: PaginatedResultsResponse<RESTPaginationMeta> = {};

  const buildPaginatedResults = (pluralName: string) => {
    const { page, pageSize, withCount } = parsePagination(
      pagination[pluralName]
    );

    paginatedResult[pluralName] = {
      data: [],
      meta: { pagination: { page: 1, pageSize: 25 } },
    };
    const startIndex = pageSize * (page - 1);
    const endIndex = startIndex + pageSize;

    paginatedResult[pluralName].data = currentResult[pluralName].slice(
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
      const total = resultsResponse[pluralName].length;
      meta.pagination.total = total;
      meta.pagination.pageCount = Math.ceil(total / pageSize);
    }

    paginatedResult[pluralName].meta = meta;
  };

  pluralNames.forEach((pluralName) => {
    if (!pagination[pluralName]) return;

    buildPaginatedResults(pluralName);
  });

  return { ...resultsResponse, ...paginatedResult };
};
