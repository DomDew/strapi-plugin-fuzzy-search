import { Schema, SchemaInfo } from '@strapi/strapi';

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export interface Config {
  contentTypes: ContentType[];
}

interface FuzzySortOptions {
  threshold?: number;
  limit?: number;
  characterLimit?: number;
  keys: [
    {
      name: string;
      weight?: number;
    }
  ];
}

export interface ContentType {
  uid: string;
  modelName: string;
  queryConstraints?: { where: {} };
  transliterate?: boolean;
  fuzzysortOptions: FuzzySortOptions;
  model: Schema & { uid: string; responseName: string; modelName: string };
}

export interface FilteredEntry {
  uid: string;
  pluralName: string;
  schemaInfo: SchemaInfo;
  transliterate: boolean;
  fuzzysortOptions: FuzzySortOptions;
  [x: string]: any;
}

export interface Result {
  pluralName: string;
  schemaInfo: SchemaInfo;
  uid: string;
  fuzzysortResults: Writeable<Fuzzysort.KeysResults<Entity>>;
}

export interface Entity {
  id: string | number;
  [x: string]: any;
}

export interface PaginationBaseQuery {
  pageSize?: string;
  page?: string;
  withCount?: 'true' | 'false';
}

export type PaginationQuery = Record<string, PaginationBaseQuery>;

export interface PaginationMeta {
  start: number;
  limit: number;
}

export interface PaginatedModelResponse {
  meta: PaginationMeta;
  data: Record<string, unknown>[];
}

export type ResultsResponse = Record<string, Record<string, unknown>[]>;

export type PaginatedResultsResponse = Record<string, PaginatedModelResponse>;

export type ModelType = Schema & {
  uid: string;
  responseName: string;
  modelName: string;
};

export interface SearchResponseArgs {
  query: string;
  locale?: string;
}

export type SearchResponseReturnType = SearchResponseArgs & {
  auth: Record<string, unknown>;
};

export interface PaginationArgs {
  page: number;
  pageSize?: number;
}
