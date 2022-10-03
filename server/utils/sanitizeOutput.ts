import { Schema } from '@strapi/strapi';
import { contentAPI } from '@strapi/utils/lib/sanitize';

const sanitizeOutput = (data: any, contentType: Schema, auth: any) =>
  contentAPI.output(data, contentType, { auth });

export default sanitizeOutput;
