const { getFilteredEntries } = require("../utils/getFilteredEntries");
const { getPluginService } = require("../utils/getPluginService");
const { validateQuery } = require("../utils/validateQuery");
const buildResult = require("../utils/buildResult");
const buildTransliteratedResult = require("../utils/buildTransliteratedResult");

module.exports = ({ strapi }) => ({
  async getResults(query, locale) {
    const { contentTypes } = getPluginService(strapi, "settingsService").get();

    // Get all projects, news and articles for a given locale and query filter, to be able to filter through them
    // Doing this in the resolver so we always have the newest entries
    const filteredEntries = await Promise.all(
      contentTypes.map(async (contentType) => {
        await validateQuery(contentType, locale);

        return {
          pluralName: contentType.model.info.pluralName,
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
