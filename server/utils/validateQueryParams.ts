import {
  paginationSchema,
  querySchema,
  SearchQuery,
} from '../config/querySchema';
import { ContentType } from '../interfaces/interfaces';

export const validateQueryParams = async (
  query: SearchQuery,
  contentTypes: ContentType[],
  pagination: Record<
    string,
    {
      pageSize?: string;
      page?: string;
      withCount?: string;
    }
  > | null,
  filteredContentTypes?: string[]
) => {
  const configModels = new Set(
    contentTypes.map((contentType) => contentType.model.info.pluralName)
  );

  const validateFilter = (filterModel: string) => {
    if (!configModels.has(filterModel))
      throw new Error(
        `Filter query for model '${filterModel}' was found, however this model is not configured in the fuzzy-search config`
      );
  };

  const validatePaginationQueryParams = async () => {
    const paginatedEntries = Object.entries(pagination);

    for (let [pluralName, paginationValues] of paginatedEntries) {
      if (!configModels.has(pluralName)) {
        throw new Error(
          `Pagination queries for model '${pluralName}' were found, however this model is not configured in the fuzzy-search config`
        );
      }

      await paginationSchema.validate(paginationValues);
    }
  };

  await querySchema.validate(query);
  if (pagination) await validatePaginationQueryParams();
  if (filteredContentTypes)
    filteredContentTypes.forEach((model) => validateFilter(model));
};
