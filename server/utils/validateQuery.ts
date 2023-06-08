import { ValidationError } from '@strapi/utils/lib/errors';
import { ContentType } from '../interfaces/interfaces';

const validateQuery = async (contentType: ContentType) => {
  contentType.fuzzysortOptions.keys.forEach((key) => {
    const attributeKeys = Object.keys(contentType.model.attributes);

    if (!attributeKeys.includes(key.name))
      throw new ValidationError(
        `Key: '${key.name}' is not a valid field for model: '${contentType.model.modelName}`
      );
  });
};

export default validateQuery;
