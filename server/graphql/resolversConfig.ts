const getResolversConfig = () => {
  return {
    "Query.search": {
      auth: {
        scope: "plugin::fuzzy-search.searchController.search",
      },
    },
  };
};

export default getResolversConfig;
