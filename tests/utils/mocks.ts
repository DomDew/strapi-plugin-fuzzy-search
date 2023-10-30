import { ContentType } from '../../server/interfaces/interfaces';

export const contentTypeMock: ContentType = {
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
  fuzzysortOptions: {
    keys: [{ name: 'name' }],
  },
  attributes: {
    name: { type: 'string' },
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
    id: 2,
    name: 'no hit',
    createdAt: '2022-09-24T12:39:34.669Z',
    updatedAt: '2023-02-27T15:12:27.479Z',
    publishedAt: '2022-09-24T12:39:53.945Z',
    locale: 'en',
  },
];
