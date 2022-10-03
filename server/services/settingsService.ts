import { Config } from '../interfaces/interfaces';
import pluginId from '../utils/pluginId';

export interface SettingsService {
  get(): Config;
  set(settings: Config): any;
  build(settings: Config): Config;
}

const settingsService = (): SettingsService => ({
  get() {
    return strapi.config.get(`plugin.${pluginId}`);
  },
  set(settings: Config) {
    return strapi.config.set(`plugin.${pluginId}`, settings);
  },
  build(settings: Config) {
    settings.contentTypes.forEach((contentType) => {
      contentType.model = strapi.contentTypes[contentType.uid];
    });

    return settings;
  },
});

export default settingsService;
