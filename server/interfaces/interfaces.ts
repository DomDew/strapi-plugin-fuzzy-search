import { Schema } from '@strapi/strapi';
import { SearchQuery } from '../config/querySchema';

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
  transliterate?: boolean;
  fuzzysortOptions: FuzzySortOptions;
  model: Schema.Schema & {
    uid: string;
    responseName: string;
    modelName: string;
  };
}

export interface FilteredEntry {
  uid: string;
  schemaInfo: Schema.Info;
  transliterate: boolean;
  fuzzysortOptions: FuzzySortOptions;
  [x: string]: any;
}

export interface Result {
  schemaInfo: Schema.Info;
  uid: string;
  fuzzysortResults: Writeable<Fuzzysort.KeysResults<Entity>>;
}

export interface Entity {
  id: string | number;
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
  data: Record<string, unknown>[];
}

export type ResultsResponse = Record<string, Record<string, unknown>[]>;

export type PaginatedResultsResponse<Meta = PaginationMeta> = Record<
  string,
  PaginatedModelResponse<Meta>
>;

export type ModelType = Schema.Schema & {
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
  state: { auth: any };
  query: SearchQuery;
  badRequest: (message: string, {}) => void;
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
