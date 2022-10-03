import settingsService from '../services/settingsService';

const buildDbQuery = (locale: string, modelUid: string) => {
  const { contentTypes } = settingsService().get();
  const { queryConstraints } = contentTypes.find(
    (entry) => entry.uid === modelUid
  );
  return {
    ...queryConstraints,
    where: {
      ...(queryConstraints?.where && { ...queryConstraints.where }),
      ...(locale && { locale: locale }),
    },
  };
};

const getFilteredEntries = async (locale: string, modelUid: string) => {
  return await strapi.db
    .query(modelUid)
    .findMany(buildDbQuery(locale, modelUid));
};

export default getFilteredEntries;
