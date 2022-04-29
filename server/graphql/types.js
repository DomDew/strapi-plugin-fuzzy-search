const { getPluginService } = require("../utils/getPluginService");
const { buildGraphqlResponse } = require("../utils/buildGraphqlResponse");

const getCustomTypes = (strapi, nexus) => {
  const { naming } = getPluginService(strapi, "utils", "graphql");
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

            const searchResults = await getPluginService(
              strapi,
              "fuzzySearchService"
            ).getResults(query, locale);

            const resultsResponse = await buildGraphqlResponse(
              searchResults,
              auth
            );
            /**
             * Error handling
             * TODO: Implement error handling
             * TODO: Locale==null Handling
             */
            if (resultsResponse) {
              return resultsResponse;
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
