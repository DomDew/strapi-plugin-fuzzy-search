import { contentAPI } from "@strapi/utils/lib/sanitize";

const sanitizeOutput = (data, contentType, auth) =>
  contentAPI.output(data, contentType, { auth });

export default sanitizeOutput;
