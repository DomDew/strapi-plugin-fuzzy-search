const getLocalizedEntries = async (locale, model) => {
  return await strapi.db.query(model).findMany({
    where: {
      locale: locale,
    },
  });
};

module.exports = {
  getLocalizedEntries,
};
