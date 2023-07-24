import { ContentType, FilteredEntry } from '../interfaces/interfaces';
import buildResult from '../utils/buildResult';
import buildTransliteratedResult from '../utils/buildTransliteratedResult';
import validateQuery from '../utils/validateQuery';

export default async function getResult(
  contentType: ContentType,
  query: string,
  filters?: Record<string, unknown>,
  locale?: string
) {
  const buildFilteredEntry = async () => {
    await validateQuery(contentType, locale);

    const items = await strapi.entityService.findMany(contentType.model.uid, {
      ...(filters && { filters }),
      ...(locale && { locale }),
    });

    return {
      uid: contentType.uid,
      modelName: contentType.modelName,
      schemaInfo: contentType.model.info,
      transliterate: contentType.transliterate,
      fuzzysortOptions: contentType.fuzzysortOptions,
      [contentType.model.info.pluralName]: items,
    };
  };

  const filteredEntry: FilteredEntry = await buildFilteredEntry();

  const keys = filteredEntry.fuzzysortOptions.keys.map((key) => key.name);

  let result = buildResult({ model: filteredEntry, keys, query });

  if (filteredEntry.transliterate) {
    result = buildTransliteratedResult({
      model: filteredEntry,
      keys,
      query,
      result,
    });
  }

  return result;
}
