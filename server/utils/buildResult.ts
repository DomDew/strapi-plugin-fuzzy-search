import fuzzysort from 'fuzzysort';
import { ContentType, FilteredEntry } from '../interfaces/interfaces';

export default ({
  model,
  keys,
  query,
}: {
  model: FilteredEntry;
  keys: string[];
  query: string;
}) => {
  console.log('MODEL', model);

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
    uid: model.uid,
    fuzzysortResults: fuzzysort.go(query, model[model.pluralName], {
      threshold: model.fuzzysortOptions.threshold,
      limit: model.fuzzysortOptions.limit,
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
