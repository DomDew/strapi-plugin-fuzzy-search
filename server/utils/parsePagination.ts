import { PaginationBaseQuery } from '../interfaces/interfaces';

export const parsePagination = (paginationQuery: PaginationBaseQuery) => {
  const {
    page: pageQuery,
    pageSize: pageSizeQuery,
    withCount: withCountQuery,
  } = paginationQuery;
  const page = pageQuery ? parseInt(pageQuery, 10) : 1;
  const pageSize = pageSizeQuery ? parseInt(pageSizeQuery, 10) : 25;
  const withCount = withCountQuery ? withCountQuery === 'true' : true;

  return { page, pageSize, withCount };
};
