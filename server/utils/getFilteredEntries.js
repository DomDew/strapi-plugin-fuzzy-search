const { getPluginService } = require("../utils/getPluginService");

const buildDbQuery = (locale, model) => {
  const { contentTypes } = getPluginService(strapi, "settingsService").get();
  const { queryConstraints } = contentTypes.find(entry => entry.uid === model);
  if (locale) {
    if (queryConstraints.where) {
      return {...queryConstraints, where: { ...queryConstraints.where, locale: locale, } };
    }
    return {...queryConstraints, where: {  locale: locale, } };
  }
  return {};
};

const getFilteredEntries = async (locale, model) => {
  return await strapi.db.query(model).findMany(buildDbQuery(locale,model));
};

module.exports = {
  getFilteredEntries,
};
