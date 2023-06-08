import { PaginationArgs } from '../interfaces/interfaces';

export const getTransformedUserPaginationInput = ({
  page,
  pageSize: inputPageSize,
  start,
  limit,
}: PaginationArgs = {}) => {
  const { config } = strapi.plugin('graphql');

  const pageSize = inputPageSize || config('defaultLimit');

  return {
    start: (page - 1) * pageSize || start || undefined,
    limit: pageSize || limit || undefined,
  };
};
