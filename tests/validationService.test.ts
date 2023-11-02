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

  describe('keys setup', async () => {
    const validateQuery = (await import('../server/services/validationService'))
      .validateQuery;

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
    const validateQuery = (await import('../server/services/validationService'))
      .validateQuery;

    const buildStrapiNamespacePlugins = (
      isLocalizedContentType: Mock<any, any>,
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
    await import('../server/services/validationService')
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
            invalidContentTypes,
          ),
        ).rejects.toThrow(
          "Filter query for model 'invalid' was found, however this model is not configured in the fuzzy-search config",
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
            null,
          ),
        ).rejects.toThrow(
          "Filter queries for model 'invalid' were found, however this model is not configured in the fuzzy-search config",
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
          null,
        ),
      ).rejects.toThrow("withCount must either be 'true' or 'false'");
    });
  });
});
