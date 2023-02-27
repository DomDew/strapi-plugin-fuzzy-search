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

// Pass query in the following format: [contentType].populate
// so that it can be destructured and passed to the model accordingly
const getFilteredEntries = async (locale: string, modelUid: string) => {
  // TODO: Destructure queries so that they can be passed to the find method
  // for each content type

  // e.g.: population[contentType] = xyz

  return await strapi.service(modelUid).find({ locale, start: 0 });

  return await strapi.db
    .query(modelUid)
    .findMany(buildDbQuery(locale, modelUid));
};

export default getFilteredEntries;
