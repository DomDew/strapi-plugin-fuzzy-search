const buildDbQuery = (locale) => {
  if (locale) return { where: { locale: locale } };

  return {};
};

const getFilteredEntries = async (locale, model) => {
  return await strapi.db.query(model).findMany(buildDbQuery(locale));
};

module.exports = {
  getFilteredEntries,
};
