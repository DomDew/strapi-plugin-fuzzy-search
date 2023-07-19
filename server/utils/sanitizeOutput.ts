import { sanitize } from '@strapi/utils';
import { Model } from '../interfaces/interfaces';

const { contentAPI } = sanitize;

const sanitizeOutput = (data: any, contentType: Model, auth: any) =>
  contentAPI.output(data, contentType, { auth });

export default sanitizeOutput;
