import { errors } from '@strapi/utils';
import {
  SearchQuery,
  paginationSchema,
  querySchema,
} from '../config/querySchema';
import { ContentType, PaginationParams } from '../interfaces/interfaces';

const { ValidationError } = errors;

const validateFilter = (configModels: Set<string>, filterModel: string) => {
  if (!configModels.has(filterModel))
    throw new Error(
      `Filter query for model '${filterModel}' was found, however this model is not configured in the fuzzy-search config`,
    );
};

const validatePaginationQueryParams = async (
  configModels: Set<string>,
  pagination: PaginationParams,
) => {
  const paginatedEntries = Object.entries(pagination);

  for (const [pluralName, paginationValues] of paginatedEntries) {
    if (!configModels.has(pluralName)) {
      throw new Error(
        `Pagination queries for model '${pluralName}' were found, however this model is not configured in the fuzzy-search config`,
      );
    }

    await paginationSchema.validate(paginationValues);
  }
};

const validateFiltersQueryParams = (
  configModels: Set<string>,
  filters: Record<string, unknown>,
) => {
  const filterKeys = Object.keys(filters);

  filterKeys.forEach((key) => {
    if (key !== 'contentTypes' && !configModels.has(key)) {
      throw new Error(
        `Filter queries for model '${key}' were found, however this model is not configured in the fuzzy-search config`,
      );
    }
  });
};

export const validateQueryParams = async (
  query: SearchQuery,
  contentTypes: ContentType[],
  pagination: PaginationParams | undefined,
  filteredContentTypes: string[] | null | undefined,
) => {
  const configModels = new Set(
    contentTypes.map((contentType) => contentType.info.pluralName),
  );

  await querySchema.validate(query);

  if (pagination) await validatePaginationQueryParams(configModels, pagination);
  if (query.filters) validateFiltersQueryParams(configModels, query.filters);

  if (filteredContentTypes)
    filteredContentTypes.forEach((model) =>
      validateFilter(configModels, model),
    );
};

export const validateQuery = async (
  contentType: ContentType,
  locale?: string,
) => {
  contentType.fuzzysortOptions.keys.forEach((key) => {
    const attributeKeys = Object.keys(contentType.attributes);

    if (!attributeKeys.includes(key.name))
      throw new ValidationError(
        `Key: '${key.name}' is not a valid field for model: '${contentType.modelName}`,
      );
  });

  if (!locale) return;

  const isLocalizedContentType: boolean =
    await strapi.plugins.i18n.services['content-types'].isLocalizedContentType(
      contentType,
    );

  if (!isLocalizedContentType) {
    throw new ValidationError(
      `A query for the locale: '${locale}' was found, however model: '${contentType.modelName}' is not a localized content type. Enable localization for all content types if you want to query for localized entries via the locale parameter.`,
    );
  }
};
