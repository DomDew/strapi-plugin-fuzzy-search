import { ContentType } from '../../server/interfaces/interfaces';

export const baseContentTypeMock = {
  uid: 'api::test.test',
  modelType: 'contentType',
  modelName: 'test',
  kind: 'collectionType',
  info: {
    singularName: 'test',
    pluralName: 'tests',
    displayName: 'test',
    description: 'A test contentType',
  },
  globalId: 'Test',
  attributes: {
    name: { type: 'string' },
  },
} as const;

export const contentTypeMock: ContentType = {
  ...baseContentTypeMock,
  fuzzysortOptions: {
    keys: [{ name: 'name' }],
  },
};

export const findManyResMock = [
  {
    id: 1,
    name: 'test',
    createdAt: '2022-09-21T16:15:15.981Z',
    updatedAt: '2023-07-24T12:00:26.427Z',
    publishedAt: '2022-09-21T16:15:45.616Z',
    locale: 'en',
  },
  {
    id: 2,
    name: 'a test hit',
    createdAt: '2022-09-24T12:39:34.669Z',
    updatedAt: '2023-02-27T15:12:27.479Z',
    publishedAt: '2022-09-24T12:39:53.945Z',
    locale: 'en',
  },
  {
    id: 3,
    name: 'localized entry',
    createdAt: '2022-09-24T12:39:34.669Z',
    updatedAt: '2023-02-27T15:12:27.479Z',
    publishedAt: '2022-09-24T12:39:53.945Z',
    locale: 'es',
  },
];

export const localizedContentTypeMock: ContentType = {
  uid: 'api::test.test',
  modelType: 'contentType',
  modelName: 'test',
  kind: 'collectionType',
  info: {
    singularName: 'test',
    pluralName: 'tests',
    displayName: 'test',
    description: 'A test contentType',
  },
  globalId: 'Test',
  transliterate: true,
  fuzzysortOptions: {
    keys: [{ name: 'name' }, { name: 'description' }],
  },
  attributes: {
    name: { type: 'string' },
    description: { type: 'text' },
  },
};

export const findManyLocalizedResMock = [
  {
    id: 1,
    name: 'Любко Дереш',
    description:
      'As an author, Lyubko has had somewhat of a cult-like following among the younger generation in Ukraine since the appearance of his novel Cult at age eighteen, which was followed almost immediately by the publication of another novel, written in early high school.',
    createdAt: '2022-05-05T13:08:19.312Z',
    updatedAt: '2022-05-05T13:34:46.488Z',
    publishedAt: '2022-05-05T13:22:17.310Z',
  },
  {
    id: 2,
    name: 'Lyubko Deresh',
    description:
      'As an author, Любко Дереш has had somewhat of a cult-like following among the younger generation in Ukraine since the appearance of his novel Cult at age eighteen, which was followed almost immediately by the publication of another novel, written in early high school.',
    createdAt: '2022-05-05T13:08:19.312Z',
    updatedAt: '2022-05-05T13:34:46.488Z',
    publishedAt: '2022-05-05T13:22:17.310Z',
  },
];
