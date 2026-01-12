import { Core } from '@strapi/strapi';
import getResolversConfig from './resolvers-config';
import getCustomTypes, { type NexusModule } from './types';

const registerGraphQLQuery = (strapi: Core.Strapi) => {
  // build plugins schema extension
  const extension = ({ nexus }: { nexus: NexusModule }) => ({
    types: getCustomTypes(strapi, nexus),
    resolversConfig: getResolversConfig(),
  });

  strapi.plugin('graphql').service('extension').use(extension);
};

export default registerGraphQLQuery;
