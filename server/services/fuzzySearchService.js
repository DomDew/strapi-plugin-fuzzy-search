const fuzzysort = require("fuzzysort");
const { getFilteredEntries } = require("../utils/getFilteredEntries");
const { getPluginService } = require("../utils/getPluginService");

module.exports = ({ strapi }) => ({
  async getResults(query, locale) {
    const { contentTypes } = getPluginService(strapi, "settingsService").get();

    // Get all projects, news and articles for a given locale and query filter, to be able to filter through them
    // Doing this in the resolver so we always have the newest entries
    const filteredEntries = await Promise.all(
      contentTypes.map(async (contentType) => {
        const isLocalizedContentType = await strapi.plugins.i18n.services[
          "content-types"
        ].isLocalizedContentType(contentType);

        if (locale && !isLocalizedContentType) {
          throw new ValidationError(
            `A query for the locale: '${locale}' was found, however content-type: '${contentType.model.modelName}' is not a localized content type. Enable localization if you want to query or localized entries.`
          );
        }

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
          allowTypo: model.fuzzysortOptions.allowTypo,
          keys: model.fuzzysortOptions.keys.map((key) => key.name),
          scoreFn: (a) =>
            Math.max(
              ...model.fuzzysortOptions.keys.map((key) =>
                a[0] ? a[0].score + key.weight : -1000
              )
            ),
        }),
      };
    });

    return searchResults;
  },
});
