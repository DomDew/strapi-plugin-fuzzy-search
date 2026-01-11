import { beforeAll, describe, expect, test, vi } from 'vitest';
import {
  buildGraphqlResponse,
  buildRestResponse,
} from '../server/src/services/response-transformation-service';
import { contentTypeMock } from './utils/mocks';

describe('response-transformation-service', () => {
  beforeAll(() => {
    global.strapi = {
      config: {
        get: vi.fn().mockReturnValue({ contentTypes: [contentTypeMock] }),
      },
      contentAPI: {
        sanitize: {
          output: vi.fn((data) => Promise.resolve(data)),
        },
      },
      plugin: vi.fn().mockReturnValue({
        service: vi.fn().mockReturnValue({
          returnTypes: {
            toEntityResponseCollection: vi.fn((nodes, options) => ({
              nodes,
              meta: options.args,
            })),
          },
        }),
      }),
    } as any;
  });

  describe('buildRestResponse', () => {
    test('should not include searchMeta when includeMatches is false', async () => {
      const mockResult = {
        fuzzysortResults: [
          {
            obj: { id: 1, name: 'test' },
            score: 0.9,
            0: { score: 0.9, indexes: [0, 1, 2, 3] },
          },
        ] as any,
        schema: { ...contentTypeMock, includeMatches: false },
      };

      const result = await buildRestResponse([mockResult], {});

      const resultArray = result[contentTypeMock.info.pluralName] as any[];
      expect(resultArray[0]).toEqual({
        id: 1,
        name: 'test',
      });
      expect(resultArray[0].searchMeta).toBeUndefined();
    });

    test('should include searchMeta when includeMatches is true at content type level', async () => {
      const mockResult = {
        fuzzysortResults: [
          {
            obj: { id: 1, name: 'test' },
            score: 0.9,
            0: { score: 0.9, indexes: [0, 1, 2, 3] },
          },
        ] as any,
        schema: { ...contentTypeMock, includeMatches: true },
      };

      const result = await buildRestResponse([mockResult], {});

      const resultArray = result[contentTypeMock.info.pluralName] as any[];
      expect(resultArray[0]).toEqual({
        id: 1,
        name: 'test',
        searchMeta: {
          score: 0.9,
          matches: {
            name: {
              score: 0.9,
              indexes: [0, 1, 2, 3],
            },
          },
        },
      });
    });

    test('should use global includeMatches when content type level is not set', async () => {
      const mockConfig = {
        includeMatches: true,
        contentTypes: [contentTypeMock],
      };

      global.strapi.config.get = vi.fn().mockReturnValue(mockConfig);

      const mockResult = {
        fuzzysortResults: [
          {
            obj: { id: 1, name: 'test' },
            score: 0.9,
            0: { score: 0.9, indexes: [0, 1, 2, 3] },
          },
        ] as any,
        schema: { ...contentTypeMock, includeMatches: undefined },
      };

      const result = await buildRestResponse([mockResult], {});

      const resultArray = result[contentTypeMock.info.pluralName] as any[];
      expect(resultArray[0].searchMeta).toBeDefined();
      expect(resultArray[0].searchMeta.score).toBe(0.9);
    });

    test('should handle null key results when field does not match', async () => {
      const mockContentType = {
        ...contentTypeMock,
        includeMatches: true,
        fuzzysortOptions: {
          ...contentTypeMock.fuzzysortOptions,
          keys: [{ name: 'name' }, { name: 'description' }],
        },
      };

      const mockResult = {
        fuzzysortResults: [
          {
            obj: { id: 1, name: 'test', description: 'no match' },
            score: 0.9,
            0: { score: 0.9, indexes: [0, 1, 2, 3] },
            1: null,
          },
        ] as any,
        schema: mockContentType,
      };

      const result = await buildRestResponse([mockResult], {});

      const resultArray = result[contentTypeMock.info.pluralName] as any[];
      expect(resultArray[0].searchMeta).toEqual({
        score: 0.9,
        matches: {
          name: {
            score: 0.9,
            indexes: [0, 1, 2, 3],
          },
          description: {
            score: null,
            indexes: null,
          },
        },
      });
    });
  });

  describe('buildGraphqlResponse', () => {
    test('should not include searchMeta when includeMatches is false', async () => {
      const mockSearchResult = [
        {
          obj: { id: 1, name: 'test' },
          score: 0.9,
          0: { score: 0.9, indexes: [0, 1, 2, 3] },
        },
      ] as any;

      const mockSchema = { ...contentTypeMock, includeMatches: false };

      const result = await buildGraphqlResponse(
        mockSearchResult,
        mockSchema,
        {},
        { start: 0, limit: 10 },
      );

      expect(result.nodes[0]).toEqual({ id: 1, name: 'test' });
      expect((result.nodes[0] as any).searchMeta).toBeUndefined();
    });

    test('should include searchMeta when includeMatches is true', async () => {
      const mockSearchResult = [
        {
          obj: { id: 1, name: 'test' },
          score: 0.9,
          0: { score: 0.9, indexes: [0, 1, 2, 3] },
        },
      ] as any;

      const mockSchema = { ...contentTypeMock, includeMatches: true };

      const result = await buildGraphqlResponse(
        mockSearchResult,
        mockSchema,
        {},
        { start: 0, limit: 10 },
      );

      expect(result.nodes[0] as any).toEqual({
        id: 1,
        name: 'test',
        searchMeta: {
          score: 0.9,
          matches: {
            name: {
              score: 0.9,
              indexes: [0, 1, 2, 3],
            },
          },
        },
      });
    });
  });
});
