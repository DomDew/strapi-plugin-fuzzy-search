import { Config } from '../interfaces/interfaces';
import pluginConfigSchema from './config.schema';

export default {
  default() {
    return {
      contentTypes: {},
    };
  },
  async validator(config: Config) {
    await pluginConfigSchema.validate(config);
  },
};
