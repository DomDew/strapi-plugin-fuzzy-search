import { Schema } from '@strapi/strapi';
import { SearchQuery } from '../config/query.schema';

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export interface Config {
  contentTypes: ContentType[];
}

export interface FuzzySortOptions {
  threshold?: number;
  limit?: number;
  characterLimit?: number;
  keys: {
    name: string;
    weight?: number;
  }[];
}

export interface ContentType extends Schema.ContentType {
  transliterate?: boolean;
  fuzzysortOptions: FuzzySortOptions;
}

export interface QueryResult extends ContentType {
  entries: Entry[];
}

export interface Result {
  fuzzysortResults: Fuzzysort.KeysResults<Entry>;
  schema: Schema.ContentType;
}

export interface Entry {
  id: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

export interface PaginationMeta {
  start: number;
  limit: number;
}

export interface RESTPaginationMeta {
  pagination: {
    page: number;
    pageSize: number;
    pageCount?: number;
    total?: number;
  };
}

export interface PaginatedModelResponse<Meta = PaginationMeta> {
  meta: Meta;
  data: unknown[];
}

export type ResultsResponse = Record<string, Record<string, unknown>[]>;

export type PaginatedResultsResponse<Meta = PaginationMeta> = Record<
  string,
  PaginatedModelResponse<Meta>
>;

export interface SearchResponseArgs {
  query: string;
  locale?: string;
}

export type SearchResponseReturnType = SearchResponseArgs & {
  auth: Record<string, unknown>;
};

export type PaginationParams = Record<
  string,
  {
    pageSize?: string;
    page?: string;
    withCount?: string;
  }
>;

export interface PaginationArgs {
  page?: number;
  pageSize?: number;
  limit?: number;
  start?: number;
}

export interface TransformedPagination {
  limit: number;
  start: number;
}

export interface Context {
  state: { auth: unknown };
  query: SearchQuery;
  badRequest: (prefix: string, message: string) => void;
}

export interface Attribute {
  type: string;
  writable?: boolean;
  relation?: string;
  [key: string]: unknown;
}

export interface Model {
  uid?: string;
  kind: 'singleType' | 'collectionType';
  info: {
    singularName: string;
    pluralName: string;
  };
  options: {
    populateCreatorFields: boolean;
  };
  privateAttributes?: string[];
  attributes: Record<string, Attribute>;
}
