"use strict";

const yup = require("yup");

const pluginConfigSchema = yup.object({
  fuseOptions: yup.object(),
  contentTypes: yup.array().of(
    yup.object({
      uid: yup.string().required(),
      modelName: yup.string().required(),
      fuzzysortOptions: yup
        .object({
          threshold: yup.number(),
          limit: yup.number(),
          allowTypo: yup.boolean(),
          keys: yup.array().of(
            yup.object({
              name: yup.string().required(),
              weight: yup.number(),
            })
          ),
        })
        .required(),
    })
  ),
});

module.exports = {
  pluginConfigSchema,
};
