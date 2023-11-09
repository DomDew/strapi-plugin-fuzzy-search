import { errors } from '@strapi/utils';
import {
  PopulationSchema,
  SearchQuery,
  paginationSchema,
  querySchema,
} from '../config/query.schema';
import { ContentType, PaginationParams } from '../interfaces/interfaces';

const { ValidationError } = errors;

const validateFilteredContentTypes = (
  configModels: Set<string>,
  filterModel: string,
) => {
  if (!configModels.has(filterModel))
    throw new Error(
      `'${filterModel}' was found in contentTypes filter query, however this model is not configured in the fuzzy-search config`,
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

const validateNestedQueryParams = (
  configModels: Set<string>,
  nestedParams: Record<string, unknown>,
) => {
  const filterKeys = Object.keys(nestedParams);

  filterKeys.forEach((key) => {
    if (key !== 'contentTypes' && !configModels.has(key)) {
      throw new Error(
        `Query params for model '${key}' were found, however this model is not configured in the fuzzy-search config`,
      );
    }
  });
};

export const validateQueryParams = async (
  query: SearchQuery,
  contentTypes: ContentType[],
  pagination: PaginationParams | undefined,
  populate: Record<string, PopulationSchema> | undefined,
  filteredContentTypes: string[] | null | undefined,
) => {
  const configModels = new Set(
    contentTypes.map((contentType) => contentType.info.pluralName),
  );

  await querySchema.validate(query);

  if (pagination) await validatePaginationQueryParams(configModels, pagination);
  if (query.filters) validateNestedQueryParams(configModels, query.filters);
  if (populate) validateNestedQueryParams(configModels, populate);

  if (filteredContentTypes)
    filteredContentTypes.forEach((model) =>
      validateFilteredContentTypes(configModels, model),
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
