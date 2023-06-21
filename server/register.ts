import { Strapi } from '@strapi/strapi';
import registerGraphlQLQuery from './graphql';
import settingsService from './services/settingsService';

export default ({ strapi }: { strapi: Strapi }) => {
  const settingsServ = settingsService();

  const settings = settingsServ.get();
  // build settings structure
  const normalizedSettings = settingsServ.build(settings);
  // reset plugin settings
  settingsServ.set(normalizedSettings);

  const hasQueryConstrains = normalizedSettings.contentTypes.find(
    (contentType) => contentType.queryConstraints
  );

  if (hasQueryConstrains) {
    strapi.log.warn(
      '[fuzzy-search] queryConstraints option is deprecated and removed in v2.0.0. Please use the new filters query parameter instead.'
    );
  }

  if (strapi.plugin('graphql')) {
    strapi.log.info('[fuzzy-search] graphql detected, registering queries');

    registerGraphlQLQuery(strapi);
  }
};
