const fuzzysort = require('fuzzysort');

module.exports = ({ model, keys, query }) => {
  if (model.fuzzysortOptions.characterLimit) {
    model[model.pluralName].forEach((entry) => {
      const entryKeys = Object.keys(entry);

      entryKeys.forEach((key) => {
        if (!keys.includes(key)) return;

        if (!entry[key]) return;

        entry[key] = entry[key].slice(0, model.fuzzysortOptions.characterLimit);
      });
    });
  }

  return {
    pluralName: model.pluralName,
    fuzzysortResults: fuzzysort.go(query, model[model.pluralName], {
      threshold: parseInt(model.fuzzysortOptions.threshold),
      limit: parseInt(model.fuzzysortOptions.limit),
      keys,
      scoreFn: (a) =>
        Math.max(
          ...model.fuzzysortOptions.keys.map((key, index) =>
            a[index] ? a[index].score + key.weight : -9999
          )
        ),
    }),
  };
};
