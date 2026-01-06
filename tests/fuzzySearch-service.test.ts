import { beforeAll, describe, expect, test, vi } from 'vitest';
import getResult from '../server/src/services/fuzzySearch-service';
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

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      documents: vi.fn().mockReturnValue({
        findMany,
      }),
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

  test('get result with status "published" (default)', async () => {
    const findMany = vi.fn().mockResolvedValue(findManyResMock);

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      documents: vi.fn().mockReturnValue({
        findMany,
      }),
    } as any;

    const result = await getResult({
      contentType: contentTypeMock,
      query: TEST_QUERY,
    });

    expect(findMany).toHaveBeenCalledWith({
      status: 'published',
    });
    expect(result.fuzzysortResults.length).toBe(2);
  }, 10000);

  test('get result with explicit status "published"', async () => {
    const findMany = vi.fn().mockResolvedValue(findManyResMock);

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      documents: vi.fn().mockReturnValue({
        findMany,
      }),
    } as any;

    const result = await getResult({
      contentType: contentTypeMock,
      query: TEST_QUERY,
      status: 'published',
    });

    expect(findMany).toHaveBeenCalledWith({
      status: 'published',
    });
    expect(result.fuzzysortResults.length).toBe(2);
  }, 10000);

  test('get result with status "draft"', async () => {
    const draftEntriesMock = [
      {
        id: 4,
        name: 'draft test',
        createdAt: '2022-09-21T16:15:15.981Z',
        updatedAt: '2023-07-24T12:00:26.427Z',
        locale: 'en',
      },
    ];

    const findMany = vi.fn().mockResolvedValue(draftEntriesMock);

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      documents: vi.fn().mockReturnValue({
        findMany,
      }),
    } as any;

    const result = await getResult({
      contentType: contentTypeMock,
      query: TEST_QUERY,
      status: 'draft',
    });

    expect(findMany).toHaveBeenCalledWith({
      status: 'draft',
    });
    expect(result.fuzzysortResults.length).toBe(1);
    expect(result.fuzzysortResults[0].obj.name).toBe('draft test');
  }, 10000);

  test('get result with status and filters combined', async () => {
    const findMany = vi.fn().mockResolvedValue(findManyResMock);

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      documents: vi.fn().mockReturnValue({
        findMany,
      }),
    } as any;

    const filters = { name: { $eq: 'test' } };

    const result = await getResult({
      contentType: contentTypeMock,
      query: TEST_QUERY,
      status: 'draft',
      filters,
    });

    expect(findMany).toHaveBeenCalledWith({
      filters,
      status: 'draft',
    });
    expect(result.fuzzysortResults.length).toBe(2);
  }, 10000);

  test('get result with status, locale, and populate combined', async () => {
    const findMany = vi.fn().mockResolvedValue(findManyResMock);

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      documents: vi.fn().mockReturnValue({
        findMany,
      }),
      plugins: {
        i18n: {
          services: {
            'content-types': {
              isLocalizedContentType: vi.fn().mockResolvedValue(true),
            },
          },
        },
      },
    } as any;

    const result = await getResult({
      contentType: contentTypeMock,
      query: TEST_QUERY,
      status: 'published',
      locale: 'en',
      populate: 'author',
    });

    expect(findMany).toHaveBeenCalledWith({
      locale: 'en',
      populate: 'author',
      status: 'published',
    });
    expect(result.fuzzysortResults.length).toBe(2);
  }, 10000);
});

describe('transliteration', () => {
  const TEST_QUERY = 'deresh';

  beforeAll(() => {
    const findMany = vi.fn().mockResolvedValue(findManyLocalizedResMock);

    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
      documents: vi.fn().mockReturnValue({
        findMany,
      }),
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
