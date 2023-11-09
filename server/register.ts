import { Strapi } from '@strapi/strapi';
import registerGraphlQLQuery from './graphql';
import settingsService from './services/settings-service';

export default ({ strapi }: { strapi: Strapi }) => {
  const {
    get: getSettings,
    build: buildSettings,
    set: setSettings,
  } = settingsService();

  const settings = getSettings();
  // build settings structure
  const normalizedSettings = buildSettings(settings);
  // reset plugin settings
  setSettings(normalizedSettings);

  if (strapi.plugin('graphql')) {
    strapi.log.info('[fuzzy-search] graphql detected, registering queries');

    registerGraphlQLQuery(strapi);
  }
};
