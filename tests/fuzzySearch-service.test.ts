import { beforeAll, describe, expect, test, vi } from 'vitest';
import getResult from '../server/services/fuzzySearch-service';
import {
  contentTypeMock,
  findManyLocalizedResMock,
  findManyResMock,
  localizedContentTypeMock,
} from './utils/mocks';

describe('getResult', () => {
  const TEST_QUERY = 'test';

  beforeAll(() => {
    const findMany = vi.fn().mockResolvedValue(findManyResMock);

    const entityService = {
      findMany,
    };

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      entityService,
    } as any;
  });

  test('get basic result', async () => {
    const result = await getResult({
      contentType: contentTypeMock,
      query: TEST_QUERY,
    });

    expect(result.fuzzysortResults.length).toBe(2);
    expect(result.fuzzysortResults[0].obj.name).toBe('test');
    expect(result.fuzzysortResults[0].score).toBe(1);
    expect(result.fuzzysortResults[1].obj.name).toBe('a test hit');
    expect(result.fuzzysortResults[1].score).toBe(0.8839519797824431);
  }, 10000);

  test('get result with threshold', async () => {
    const contentType = {
      ...contentTypeMock,
      fuzzysortOptions: {
        ...contentTypeMock.fuzzysortOptions,
        threshold: 0.9,
      },
    };

    const result = await getResult({
      contentType,
      query: TEST_QUERY,
    });

    expect(result.fuzzysortResults.length).toBe(1);
    expect(result.fuzzysortResults[0].obj.name).toBe('test');
    expect(result.fuzzysortResults[0].score).toBe(1);
  }, 10000);

  test('get result with weights', async () => {
    const contentType = {
      ...contentTypeMock,
      fuzzysortOptions: {
        ...contentTypeMock.fuzzysortOptions,
        keys: [
          {
            name: 'name',
            weight: 0.2,
          },
        ],
      },
    };

    const result = await getResult({
      contentType,
      query: TEST_QUERY,
    });

    expect(result.fuzzysortResults.length).toBe(2);
    expect(result.fuzzysortResults[0].obj.name).toBe('test');
    expect(result.fuzzysortResults[0].score).toBe(1.2);
    expect(result.fuzzysortResults[1].obj.name).toBe('a test hit');
    expect(result.fuzzysortResults[1].score).toBe(1.083951979782443);
  }, 10000);

  test('get result with limit', async () => {
    const contentType = {
      ...contentTypeMock,
      fuzzysortOptions: {
        ...contentTypeMock.fuzzysortOptions,
        limit: 1,
      },
    };

    const result = await getResult({
      contentType,
      query: TEST_QUERY,
    });

    expect(result.fuzzysortResults.length).toBe(1);
    expect(result.fuzzysortResults[0].obj.name).toBe('test');
    expect(result.fuzzysortResults[0].score).toBe(1);
  }, 10000);

  test('get result with characterLimit', async () => {
    const contentType = {
      ...contentTypeMock,
      fuzzysortOptions: {
        ...contentTypeMock.fuzzysortOptions,
        characterLimit: 3,
      },
    };

    const result = await getResult({
      contentType,
      query: 'tes',
    });

    expect(result.fuzzysortResults.length).toBe(1);
    expect(result.fuzzysortResults[0].obj.name).toBe('tes');
    expect(result.fuzzysortResults[0].score).toBe(1);
  }, 10000);
});

describe('transliteration', () => {
  const TEST_QUERY = 'deresh';

  beforeAll(() => {
    const findMany = vi.fn().mockResolvedValue(findManyLocalizedResMock);

    const entityService = {
      findMany,
    };

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      entityService,
    } as any;
  });

  test('get result with transliteration', async () => {
    const result = await getResult({
      contentType: localizedContentTypeMock,
      query: TEST_QUERY,
    });

    expect(result.fuzzysortResults.length).toBe(2);
    expect(result.fuzzysortResults[0].obj).toEqual({
      id: 2,
      name: 'Lyubko Deresh',
      description:
        'As an author, Любко Дереш has had somewhat of a cult-like following among the younger generation in Ukraine since the appearance of his novel Cult at age eighteen, which was followed almost immediately by the publication of another novel, written in early high school.',
      createdAt: '2022-05-05T13:08:19.312Z',
      updatedAt: '2022-05-05T13:34:46.488Z',
      publishedAt: '2022-05-05T13:22:17.310Z',
    });
    expect(result.fuzzysortResults[0].score).toBe(0.8745480242383942);
    expect(result.fuzzysortResults[1].obj).toEqual({
      id: 1,
      name: 'Любко Дереш',
      description:
        'As an author, Lyubko has had somewhat of a cult-like following among the younger generation in Ukraine since the appearance of his novel Cult at age eighteen, which was followed almost immediately by the publication of another novel, written in early high school.',
      createdAt: '2022-05-05T13:08:19.312Z',
      updatedAt: '2022-05-05T13:34:46.488Z',
      publishedAt: '2022-05-05T13:22:17.310Z',
    });
    expect(result.fuzzysortResults[1].score).toBe(0.8745480242383942);
  }, 10000);
});
