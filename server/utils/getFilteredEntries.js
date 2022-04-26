const { getPluginService } = require("../utils/getPluginService");

const buildDbQuery = (locale, model) => {
  const { contentTypes } = getPluginService(strapi, "settingsService").get();
  const { whereConstraints } = contentTypes.find(entry => entry.uid === model);
  if (locale) return { where: { locale: locale,...whereConstraints } };

  return {};
};

const getFilteredEntries = async (locale, model) => {
  return await strapi.db.query(model).findMany(buildDbQuery(locale,model));
};

module.exports = {
  getFilteredEntries,
};
