'use strict';
const { getPluginService } = require('./utils/getPluginService');

module.exports = ({ strapi }) => {
  const settingsService = getPluginService(strapi, 'settingsService');
  const settings = settingsService.get();

  // set up lifecycles
  const subscribe = {
    models: settings.contentTypes.map((contentType) => contentType.uid),
  };

  strapi.db.lifecycles.subscribe(subscribe);
};
