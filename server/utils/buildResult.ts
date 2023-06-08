import fuzzysort from 'fuzzysort';
import { Entity, FilteredEntry } from '../interfaces/interfaces';

export default ({
  model,
  keys,
  query,
}: {
  model: FilteredEntry;
  keys: string[];
  query: string;
}) => {
  const { pluralName } = model.schemaInfo;

  if (model.fuzzysortOptions.characterLimit) {
    model[pluralName].forEach((entry) => {
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
    schemaInfo: model.schemaInfo,
    uid: model.uid,
    fuzzysortResults: fuzzysort.go<Entity>(query, model[pluralName], {
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
