import { FilteredEntry } from '../interfaces/interfaces';
import buildResult from '../utils/buildResult';
import buildTransliteratedResult from '../utils/buildTransliteratedResult';
import getFilteredEntries from '../utils/getFilteredEntries';
import validateQuery from '../utils/validateQuery';
import settingsService from './settingsService';

export default () => ({
  async getResults(query: string, locale: string) {
    const { contentTypes } = settingsService().get();

    // Get all projects, news and articles for a given locale and query filter, to be able to filter through them
    // Doing this in the resolver so we always have the newest entries
    const filteredEntries: FilteredEntry[] = await Promise.all(
      contentTypes.map(async (contentType) => {
        await validateQuery(contentType, locale);

        return {
          uid: contentType.uid,
          pluralName: contentType.model.info.pluralName,
          modelName: contentType.modelName,
          schemaInfo: contentType.model.info,
          transliterate: contentType.transliterate,
          fuzzysortOptions: contentType.fuzzysortOptions,
          [contentType.model.info.pluralName]: await getFilteredEntries(
            locale,
            contentType.model.uid
          ),
        };
      })
    );

    const searchResult = filteredEntries.map((model) => {
      const keys = model.fuzzysortOptions.keys.map((key) => key.name);

      let result = buildResult({ model, keys, query });

      if (model.transliterate) {
        result = buildTransliteratedResult({ model, keys, query, result });
      }

      return result;
    });

    return searchResult;
  },
});
