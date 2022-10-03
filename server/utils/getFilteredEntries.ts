import settingsService from "../services/settingsService";

const buildDbQuery = (locale, model) => {
  const { contentTypes } = settingsService().get();
  const { queryConstraints } = contentTypes.find(
    (entry) => entry.uid === model
  );
  return {
    ...queryConstraints,
    where: {
      ...(queryConstraints?.where && { ...queryConstraints.where }),
      ...(locale && { locale: locale }),
    },
  };
};

const getFilteredEntries = async (locale, model) => {
  return await strapi.db.query(model).findMany(buildDbQuery(locale, model));
};

export default getFilteredEntries;
