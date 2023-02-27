import { InferType, object, string } from 'yup';

export const paginationSchema = object({
  pageSize: string().matches(/^\d+$/, 'pageSize must be an integer'),
  page: string().matches(/^\d+$/, 'page must be an integer'),
  withCount: string().oneOf(
    ['true', 'false'],
    "withCount must either be 'true' or 'false'"
  ),
});

export const querySchema = object({
  query: string().required(),
  locale: string().max(2),
  filters: object({
    contentTypes: string(),
  }),
});

export type PaginationBaseQuery = InferType<typeof paginationSchema>;

export type SearchQuery = InferType<typeof querySchema> & {
  pagination: Record<string, PaginationBaseQuery>;
};
