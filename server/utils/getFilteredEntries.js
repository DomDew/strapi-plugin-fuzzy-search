const { getPluginService } = require("../utils/getPluginService");

const buildDbQuery = (locale, model) => {
  const { contentTypes } = getPluginService(strapi, "settingsService").get();
  const { queryConstraints } = contentTypes.find(entry => entry.uid === model);
  return {
    ...queryConstraints,
    where: {
      ...(queryConstraints?.where && { ...queryConstraints.where }),
      ...(locale && { locale: locale }),
    },
  };
};

const getFilteredEntries = async (locale, model) => {
  return await strapi.db.query(model).findMany(buildDbQuery(locale,model));
};

module.exports = {
  getFilteredEntries,
};
