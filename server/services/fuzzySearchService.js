const fuzzysort = require("fuzzysort");
const { getFilteredEntries } = require("../utils/getFilteredEntries");
const { getPluginService } = require("../utils/getPluginService");
const { validateQuery } = require("../utils/validateQuery");

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
          fuzzysortOptions: contentType.fuzzysortOptions,
          [contentType.model.info.pluralName]: await getFilteredEntries(
            locale,
            contentType.model.uid
          ),
        };
      })
    );

    const searchResults = filteredEntries.map((model) => {
      const keys = model.fuzzysortOptions.keys.map((key) => key.name);

      // Splice strings to search if characterLimit has been passed
      if (model.fuzzysortOptions.characterLimit) {
        model[model.pluralName].forEach((entry) => {
          const entryKeys = Object.keys(entry);

          entryKeys.forEach((key) => {
            if (!keys.includes(key)) return;

            if (!entry[key]) return;

            entry[key] = entry[key].slice(
              0,
              model.fuzzysortOptions.characterLimit
            );
          });
        });
      }

      return {
        pluralName: model.pluralName,
        fuzzysort: fuzzysort.go(query, model[model.pluralName], {
          threshold: parseInt(model.fuzzysortOptions.threshold),
          limit: parseInt(model.fuzzysortOptions.limit),
          keys: model.fuzzysortOptions.keys.map((key) => key.name),
          scoreFn: (a) =>
            Math.max(
              ...model.fuzzysortOptions.keys.map((key, index) =>
                a[index] ? a[index].score + key.weight : -9999
              )
            ),
        }),
      };
    });

    return searchResults;
  },
});
