import { PaginationBaseQuery } from '../config/querySchema';
import {
  PaginatedModelResponse,
  PaginatedResultsResponse,
  PaginationArgs,
  PaginationMeta,
  RESTPaginationMeta,
  ResultsResponse,
} from '../interfaces/interfaces';

const parsePaginationArgs = (paginationQuery: PaginationBaseQuery) => {
  const {
    page: pageQuery = '1',
    pageSize: pageSizeQuery = '25',
    withCount: withCountQuery = 'true',
  } = paginationQuery;
  const page = pageQuery ? parseInt(pageQuery, 10) : 1;
  const pageSize = pageSizeQuery ? parseInt(pageSizeQuery, 10) : 25;
  const withCount = withCountQuery ? withCountQuery === 'true' : true;

  return { page, pageSize, withCount };
};

export const paginateRestResults = async (
  pagination: Record<string, PaginationBaseQuery>,
  pluralNames: string[],
  resultsResponse: ResultsResponse,
) => {
  const currentResult = { ...resultsResponse };
  const paginatedResult: PaginatedResultsResponse<RESTPaginationMeta> = {};

  const buildPaginatedResults = (pluralName: string) => {
    const { page, pageSize, withCount } = parsePaginationArgs(
      pagination[pluralName],
    );

    paginatedResult[pluralName] = {
      data: [],
      meta: { pagination: { page: 1, pageSize: 25 } },
    };
    const startIndex = pageSize * (page - 1);
    const endIndex = startIndex + pageSize;

    paginatedResult[pluralName].data = currentResult[pluralName].slice(
      startIndex,
      endIndex,
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

export const getTransformedUserPaginationInput = ({
  page,
  pageSize: inputPageSize,
  start,
  limit,
}: PaginationArgs = {}) => {
  const { config } = strapi.plugin('graphql');

  const pageSize = inputPageSize || config('defaultLimit');
  const pageNumber = (page || 1) - 1;

  return {
    start: pageNumber * (pageSize || 15) || start || undefined,
    limit: pageSize || limit || undefined,
  };
};

export const paginateGraphQlResults = (
  results: unknown[],
  { limit: limitInput, start: startInput }: PaginationArgs = {},
): PaginatedModelResponse => {
  const { config } = strapi.plugin('graphql');
  const resultsCopy = [...results];

  const start = startInput || 0;
  const limit = limitInput || config('defaultLimit') || 15;

  const data = resultsCopy.slice(start, start + limit);

  // Strapi only accepts start and limit at meta args
  // and calculates values in toEntityResponseCollection() util
  const meta: PaginationMeta = {
    start,
    limit,
  };

  return { data, meta };
};
