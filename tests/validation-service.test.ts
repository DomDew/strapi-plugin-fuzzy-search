import { Mock, beforeAll, describe, expect, test, vi } from 'vitest';
import { baseContentTypeMock, contentTypeMock } from './utils/mocks';

describe('validateQuery', () => {
  beforeAll(() => {
    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
    } as any;
  });

  describe('content type', async () => {
    const validateQuery = (
      await import('../server/src/services/validation-service')
    ).validateQuery;

    test('validates contentType of kind singleType as invalid', async () => {
      const invalidConfiguration = {
        ...baseContentTypeMock,
        fuzzysortOptions: {
          keys: [{ name: 'name' }],
        },
        kind: 'singleType' as const,
        modelName: 'invalid',
      };

      await expect(validateQuery(invalidConfiguration)).rejects.toThrow(
        "Content type: 'invalid' is not a collectionType",
      );
    });
  });

  describe('keys setup', async () => {
    const validateQuery = (
      await import('../server/src/services/validation-service')
    ).validateQuery;

    test("validates keys setup for model 'test' as valid", async () => {
      const validConfiguration = {
        ...baseContentTypeMock,
        fuzzysortOptions: {
          keys: [{ name: 'name' }],
        },
      };

      await validateQuery(validConfiguration);
    });

    test("throws an error if keys setup for model 'test' is invalid", async () => {
      const invalidConfiguration = {
        ...baseContentTypeMock,
        fuzzysortOptions: {
          keys: [{ name: 'invalid' }],
        },
      };

      await expect(validateQuery(invalidConfiguration)).rejects.toThrow(
        "Key: 'invalid' is not a valid field for model: 'test",
      );
    });
  });

  describe('localization', async () => {
    const validateQuery = (
      await import('../server/src/services/validation-service')
    ).validateQuery;

    const buildStrapiNamespacePlugins = (
      isLocalizedContentType: Mock<any>,
    ) => ({
      i18n: {
        services: {
          'content-types': {
            isLocalizedContentType,
          },
        },
      },
    });

    test("validates localization for model 'test' as valid", async () => {
      const isLocalizedContentType = vi.fn().mockResolvedValue(true);

      global.strapi.plugins = buildStrapiNamespacePlugins(
        isLocalizedContentType,
      ) as any;

      await validateQuery(contentTypeMock, 'en');
    });

    test("throws an error if localization for model 'test' is invalid", async () => {
      const isLocalizedContentType = vi.fn().mockResolvedValue(false);

      global.strapi.plugins = buildStrapiNamespacePlugins(
        isLocalizedContentType,
      ) as any;

      await expect(validateQuery(contentTypeMock, 'en')).rejects.toThrow(
        "A query for the locale: 'en' was found, however model: 'test' is not a localized content type. Enable localization for all content types if you want to query for localized entries via the locale parameter.",
      );
    });
  });
});

describe('validateQueryParams', async () => {
  const validateQueryParams = (
    await import('../server/src/services/validation-service')
  ).validateQueryParams;

  beforeAll(() => {
    global.strapi = {
      contentTypes: {
        'api::test.test': contentTypeMock,
      },
    } as any;
  });

  describe('filters', () => {
    describe('contentTypes param', () => {
      test('validates contentTypes as valid', async () => {
        const validContentTypes = ['tests'];

        validateQueryParams(
          {
            query: 'test',
            locale: undefined,
          },
          [contentTypeMock],
          undefined,
          undefined,
          validContentTypes,
        );
      });

      test("validates contentTypes as invalid if they don't exist", async () => {
        const invalidContentTypes = ['invalid'];

        expect(
          validateQueryParams(
            {
              query: 'test',
              locale: undefined,
            },
            [contentTypeMock],
            undefined,
            undefined,
            invalidContentTypes,
          ),
        ).rejects.toThrow(
          "'invalid' was found in contentTypes filter query, however this model is not configured in the fuzzy-search config",
        );
      });
    });

    describe('filters param', () => {
      test('validates filters for models as valid if they exist', async () => {
        validateQueryParams(
          {
            query: 'test',
            locale: undefined,
            filters: {
              contentTypes: undefined,
              tests: {
                name: {
                  $eq: 'test',
                },
              },
            },
          },
          [contentTypeMock],
          undefined,
          undefined,
          null,
        );
      });

      test("validates filters for models as invalid if they don't exist", async () => {
        expect(
          validateQueryParams(
            {
              query: 'test',
              locale: undefined,
              filters: {
                contentTypes: undefined,
                invalid: {},
              },
            },
            [contentTypeMock],
            undefined,
            undefined,
            null,
          ),
        ).rejects.toThrow(
          "Query params for model 'invalid' were found, however this model is not configured in the fuzzy-search config",
        );
      });
    });
  });

  describe('pagination params', () => {
    test('validates pagination params as valid', async () => {
      const pagination = {
        pageSize: '10',
        page: '1',
        withCount: 'true',
      };

      validateQueryParams(
        {
          query: 'test',
          locale: undefined,
          pagination: { tests: pagination },
        },
        [contentTypeMock],
        { tests: pagination },
        undefined,
        null,
      );
    });

    test('validates pagination params as invalid if the model is not configured', async () => {
      const pagination = {
        pageSize: '10',
        page: '1',
        withCount: 'true',
      };

      expect(
        validateQueryParams(
          {
            query: 'test',
            locale: undefined,
            pagination: { invalid: pagination },
          },
          [contentTypeMock],
          { invalid: pagination },
          undefined,
          null,
        ),
      ).rejects.toThrow(
        "Pagination queries for model 'invalid' were found, however this model is not configured in the fuzzy-search config",
      );
    });

    test('validates pageSize param as invalid', async () => {
      const pagination = {
        pageSize: 'invalid',
        page: '1',
        withCount: 'true',
      };

      expect(
        validateQueryParams(
          {
            query: 'test',
            locale: undefined,
            pagination: { tests: pagination },
          },
          [contentTypeMock],
          { tests: pagination },
          undefined,
          null,
        ),
      ).rejects.toThrow('pageSize must be an integer');
    });

    test('validates page param as invalid', async () => {
      const pagination = {
        pageSize: '5',
        page: 'invalid',
        withCount: 'true',
      };

      expect(
        validateQueryParams(
          {
            query: 'test',
            locale: undefined,
            pagination: { tests: pagination },
          },
          [contentTypeMock],
          { tests: pagination },
          undefined,
          null,
        ),
      ).rejects.toThrow('page must be an integer');
    });

    test('validates withCount param as invalid', async () => {
      const pagination = {
        pageSize: '5',
        page: '1',
        withCount: 'invalid',
      };

      expect(
        validateQueryParams(
          {
            query: 'test',
            locale: undefined,
            pagination: { tests: pagination },
          },
          [contentTypeMock],
          { tests: pagination },
          undefined,
          null,
        ),
      ).rejects.toThrow("withCount must either be 'true' or 'false'");
    });
  });

  describe('population params', () => {
    test('validates population params as valid', async () => {
      const populate = 'tests';

      validateQueryParams(
        {
          query: 'test',
          locale: undefined,
          populate: { tests: populate },
        },
        [contentTypeMock],
        undefined,
        { tests: populate },
        null,
      );
    });

    test('validates population params as invalid if the model is not configured', async () => {
      const populate = 'invalid';

      expect(
        validateQueryParams(
          {
            query: 'test',
            locale: undefined,
            populate: { invalid: populate },
          },
          [contentTypeMock],
          undefined,
          { invalid: populate },
          null,
        ),
      ).rejects.toThrow(
        "Query params for model 'invalid' were found, however this model is not configured in the fuzzy-search config",
      );
    });
  });
});
