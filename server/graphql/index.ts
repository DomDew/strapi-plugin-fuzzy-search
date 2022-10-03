import getResolversConfig from "./resolversConfig";
import getCustomTypes from "./types";

const registerGraphlQLQuery = (strapi) => {
  // build plugins schema extension
  const extension = ({ nexus }) => ({
    types: getCustomTypes(strapi, nexus),
    resolversConfig: getResolversConfig(),
  });

  strapi.plugin("graphql").service("extension").use(extension);
};

export default registerGraphlQLQuery;
