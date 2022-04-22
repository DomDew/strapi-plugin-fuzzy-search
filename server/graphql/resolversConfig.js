const getResolversConfig = () => {
  return {
    "Query.search": {
      auth: false,
    },
  };
};

module.exports = {
  getResolversConfig,
};
