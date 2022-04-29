const getResolversConfig = () => {
  return {
    "Query.search": {
      auth: {
        scope: "plugin::fuzzy-search.searchController.search",
      },
    },
  };
};

module.exports = {
  getResolversConfig,
};
