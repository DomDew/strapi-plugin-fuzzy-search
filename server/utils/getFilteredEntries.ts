const getFilteredEntries = async (
  modelUid: string,
  filters?: Record<string, unknown>
) => {
  return await strapi.entityService.findMany(modelUid, {
    ...(filters && { filters }),
  });
};

export default getFilteredEntries;
