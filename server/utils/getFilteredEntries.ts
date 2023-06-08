const getFilteredEntries = async (
  modelUid: string,
  filters?: Record<string, unknown>,
  locale?: string
) => {
  console.log('LOCALE', locale);

  return await strapi.entityService.findMany(modelUid, {
    filters: {
      ...(filters && { ...filters }),
      ...(locale && { locale }),
    },
  });
};

export default getFilteredEntries;
