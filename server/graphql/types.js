const fuzzysort = require("fuzzysort");
const _ = require("lodash");
const { getLocalizedEntries } = require("../utils/getLocalizedEntries");
const { getPluginService } = require("../utils/getPluginService");

const getCustomTypes = (strapi, nexus) => {
  const { naming } = getPluginService(strapi, "utils", "graphql");
  const { toEntityResponseCollection } = getPluginService(
    strapi,
    "format",
    "graphql"
  ).returnTypes;
  const { contentTypes } = getPluginService(strapi, "settingsService").get();
  const { getEntityResponseCollectionName } = naming;



  // Get response names
  contentTypes.forEach((type) => {
    type.model.responseName = getEntityResponseCollectionName(type.model);
  });

  // Use to extend the SearchResponse type for each model
  const extendSearchType = (nexus, model) => {
    return nexus.extendType({
      type: "SearchResponse",
      definition(t) {
        t.field(model.info.pluralName, { type: model.responseName });
      },
    });
  };

  const returnTypes = [
    nexus.objectType({
      name: "SearchResponse",
      definition() {},
    }),
    nexus.extendType({
      type: "Query",
      definition(t) {
        t.field("search", {
          type: "SearchResponse",
          args: {
            query: nexus.nonNull(
              nexus.stringArg(
                "The query string by which the models are searched"
              )
            ),
            locale: nexus.stringArg("The locale by which to filter the models"),
          },
          async resolve(_parent, args, ctx) {
            // Destructure the args to get query value
            const { query, locale } = args;

            // Get all projects, news and articles for a given locale, to be able to filter through them
            // Doing this in the resolver so we always have the newest entries
            const localizedEntries = await Promise.all(
              contentTypes.map(async (contentType) => {
                return {
                  pluralName: contentType.model.info.pluralName,
                  fuzzysortOptions: contentType.fuzzysortOptions,
                  [contentType.model.info.pluralName]:
                    await getLocalizedEntries(locale, contentType.model.uid),
                };
              })
            );

            const searchResults = localizedEntries.map((model) => {
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

            // Destructure search results and return them in appropriate format
            const results = {};

            searchResults.forEach((res) => {
              results[res.pluralName] = toEntityResponseCollection(
                res.fuzzysort.map((fuzzyRes) => fuzzyRes.obj)
              );
            });

            /**
             * Error handling
             * TODO: Implement error handling
             * TODO: Locale==null Handling
             */
            if (results) {
              return results;
            } else {
              throw new Error(ctx.koaContext.response.message);
            }
          },
        });
      },
    }),
  ];

  contentTypes.forEach((type) => {
    returnTypes.unshift(extendSearchType(nexus, type.model));
  });

  return returnTypes;
};

module.exports = {
  getCustomTypes,
};
