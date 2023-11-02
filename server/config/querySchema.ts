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
  locale: string(),
  filters: object({
    contentTypes: string(),
  }),
});

export type PaginationBaseQuery = InferType<typeof paginationSchema>;

type QuerySchema = InferType<typeof querySchema>;

export type SearchQuery = Omit<QuerySchema, 'filters'> & {
  pagination?: Record<string, PaginationBaseQuery>;
  filters?: QuerySchema['filters'] & Record<string, any>;
};
