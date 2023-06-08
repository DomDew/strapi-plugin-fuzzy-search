import { ContentType, FilteredEntry } from '../interfaces/interfaces';
import buildResult from '../utils/buildResult';
import buildTransliteratedResult from '../utils/buildTransliteratedResult';
import getFilteredEntries from '../utils/getFilteredEntries';
import validateQuery from '../utils/validateQuery';

export default async function getResult(
  contentType: ContentType,
  query: string,
  filters: Record<string, unknown>
) {
  const buildFilteredEntry = async () => {
    await validateQuery(contentType);
    const entries = await getFilteredEntries(contentType.model.uid, filters);

    return {
      uid: contentType.uid,
      pluralName: contentType.model.info.singularName,
      modelName: contentType.modelName,
      schemaInfo: contentType.model.info,
      transliterate: contentType.transliterate,
      fuzzysortOptions: contentType.fuzzysortOptions,
      [contentType.model.info.pluralName]: entries,
    };
  };

  // Get all projects, news and articles for a given locale and query filter, to be able to filter through them
  // Doing this in the resolver so we always have the newest entries
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
