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
    return {
      ...settings,
      contentTypes: settings.contentTypes.map((contentType) => ({
        ...contentType,
        ...strapi.contentTypes[contentType.uid],
      })),
    };
  },
});

export default settingsService;
