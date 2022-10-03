import { Schema } from '@strapi/strapi';

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
  transliterate: boolean;
  fuzzysortOptions: FuzzySortOptions;
  [x: string]: any;
}

export interface Result {
  pluralName: string;
  uid: string;
  fuzzysortResults: Writeable<Fuzzysort.KeysResults<Entity>>;
}

export interface Entity {
  id: string | number;
  [x: string]: any;
}
