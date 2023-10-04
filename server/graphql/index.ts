import { Strapi } from '@strapi/strapi';
import getResolversConfig from './resolversConfig';
import getCustomTypes from './types';

const registerGraphlQLQuery = (strapi: Strapi) => {
  // build plugins schema extension
  const extension = ({ nexus }: { nexus: any }) => ({
    types: getCustomTypes(strapi, nexus),
    resolversConfig: getResolversConfig(),
  });

  strapi.plugin('graphql').service('extension').use(extension);
};

export default registerGraphlQLQuery;
