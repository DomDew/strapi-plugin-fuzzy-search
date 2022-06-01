const { ValidationError } = require("@strapi/utils/lib/errors");

const validateQuery = async (contentType, locale) => {
  if (!locale) {
    return;
  }
  
  const isLocalizedContentType = await strapi.plugins.i18n.services[
    "content-types"
  ].isLocalizedContentType(contentType.model);

  if (!isLocalizedContentType) {
    throw new ValidationError(
      `A query for the locale: '${locale}' was found, however model: '${contentType.model.modelName}' is not a localized content type. Enable localization if you want to query or localized entries.`
    );
  }

  contentType.fuzzysortOptions.keys.forEach((key) => {
    const attributeKeys = Object.keys(contentType.model.attributes);

    if (!attributeKeys.includes(key.name))
      throw new ValidationError(
        `Key: '${key.name}' is not a valid field for model: '${contentType.model.modelName}`
      );
  });
};

module.exports = {
  validateQuery,
};
