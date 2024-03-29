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

    expect(result.fuzzysortResults.length).toBe(3);
    expect(result.fuzzysortResults[0].obj.name).toBe('test');
    expect(result.fuzzysortResults[0].score).toBe(0);
    expect(result.fuzzysortResults[1].obj.name).toBe('a test hit');
    expect(result.fuzzysortResults[1].score).toBe(-6.002768166089965);
    expect(result.fuzzysortResults[2].obj.name).toBe('localized entry');
    expect(result.fuzzysortResults[2].score).toBe(-9999);
  }, 10000);

  test('get result with threshold', async () => {
    const contentType = {
      ...contentTypeMock,
      fuzzysortOptions: {
        ...contentTypeMock.fuzzysortOptions,
        threshold: -1000,
      },
    };

    const result = await getResult({
      contentType,
      query: TEST_QUERY,
    });

    expect(result.fuzzysortResults.length).toBe(2);
    expect(result.fuzzysortResults[0].obj.name).toBe('test');
    expect(result.fuzzysortResults[0].score).toBe(0);
    expect(result.fuzzysortResults[1].obj.name).toBe('a test hit');
    expect(result.fuzzysortResults[1].score).toBe(-6.002768166089965);
  }, 10000);

  test('get result with weights', async () => {
    const contentType = {
      ...contentTypeMock,
      fuzzysortOptions: {
        ...contentTypeMock.fuzzysortOptions,
        keys: [
          {
            name: 'name',
            weight: 200,
          },
        ],
      },
    };

    const result = await getResult({
      contentType,
      query: TEST_QUERY,
    });

    expect(result.fuzzysortResults.length).toBe(3);
    expect(result.fuzzysortResults[0].obj.name).toBe('test');
    expect(result.fuzzysortResults[0].score).toBe(200);
    expect(result.fuzzysortResults[1].obj.name).toBe('a test hit');
    expect(result.fuzzysortResults[1].score).toBe(193.99723183391004);
    expect(result.fuzzysortResults[2].obj.name).toBe('localized entry');
    expect(result.fuzzysortResults[2].score).toBe(-9999);
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
    expect(result.fuzzysortResults[0].score).toBe(0);
  }, 10000);

  test('get result with characterLimit', async () => {
    const contentType = {
      ...contentTypeMock,
      fuzzysortOptions: {
        ...contentTypeMock.fuzzysortOptions,
        characterLimit: 4,
      },
    };

    const result = await getResult({
      contentType,
      query: TEST_QUERY,
    });

    expect(result.fuzzysortResults.length).toBe(3);
    expect(result.fuzzysortResults[0].obj.name).toBe('test');
    expect(result.fuzzysortResults[0].score).toBe(0);
    expect(result.fuzzysortResults[1].obj.name).toBe('loca');
    expect(result.fuzzysortResults[1].score).toBe(-9999);
    expect(result.fuzzysortResults[2].obj.name).toBe('a te');
    expect(result.fuzzysortResults[2].score).toBe(-9999);
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
    expect(result.fuzzysortResults[0].score).toBe(-7.007158509861212);
    expect(result.fuzzysortResults[1].obj).toEqual({
      id: 1,
      name: 'Любко Дереш',
      description:
        'As an author, Lyubko has had somewhat of a cult-like following among the younger generation in Ukraine since the appearance of his novel Cult at age eighteen, which was followed almost immediately by the publication of another novel, written in early high school.',
      createdAt: '2022-05-05T13:08:19.312Z',
      updatedAt: '2022-05-05T13:34:46.488Z',
      publishedAt: '2022-05-05T13:22:17.310Z',
    });
    expect(result.fuzzysortResults[1].score).toBe(-7.007158509861212);
  }, 10000);
});
