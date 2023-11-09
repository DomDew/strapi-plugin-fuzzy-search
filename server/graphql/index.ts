import { Strapi } from '@strapi/strapi';
import getResolversConfig from './resolvers-config';
import getCustomTypes from './types';

const registerGraphlQLQuery = (strapi: Strapi) => {
  // build plugins schema extension
  const extension = ({ nexus }: { nexus: unknown }) => ({
    types: getCustomTypes(strapi, nexus),
    resolversConfig: getResolversConfig(),
  });

  strapi.plugin('graphql').service('extension').use(extension);
};

export default registerGraphlQLQuery;
