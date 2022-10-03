import getResolversConfig from './resolversConfig';
import getCustomTypes from './types';
import { Strapi } from '@strapi/strapi';

const registerGraphlQLQuery = (strapi: Strapi) => {
  // build plugins schema extension
  const extension = ({ nexus }) => ({
    types: getCustomTypes(strapi, nexus),
    resolversConfig: getResolversConfig(),
  });

  strapi.plugin('graphql').service('extension').use(extension);
};

export default registerGraphlQLQuery;
