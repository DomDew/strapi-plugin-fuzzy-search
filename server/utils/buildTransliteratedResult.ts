import fuzzysort from "fuzzysort";
import { transliterate } from "transliteration";
import { ContentType } from "../interfaces/interfaces";

export default ({ model, keys, query, result }) => {
  /**
   * Transliterate relevant fields for the entry
   */
  model[model.pluralName].forEach((entry) => {
    const entryKeys = Object.keys(entry);
    console.log(entry);

    entry.transliterations = {};

    entryKeys.forEach((key) => {
      if (!keys.includes(key) || !entry[key]) return;

      entry.transliterations[key] = transliterate(entry[key]);
    });
  });

  const transliterationKeys = keys.map((key) => `transliterations.${key}`);

  // TODO: Correctly Type Entry
  const transliteratedResult = {
    pluralName: model.pluralName,
    fuzzysortResults: fuzzysort.go<{ id: string }>(
      query,
      model[model.pluralName],
      {
        threshold: parseInt(model.fuzzysortOptions.threshold),
        limit: parseInt(model.fuzzysortOptions.limit),
        keys: transliterationKeys,
        scoreFn: (a) =>
          Math.max(
            ...model.fuzzysortOptions.keys.map((key, index) =>
              a[index] ? a[index].score + key.weight : -9999
            )
          ),
      }
    ),
  };

  if (!result.fuzzysortResults.total) return transliteratedResult;

  // In the chance that a transliterated result scores higher than its non-transliterated counterpart,
  // overwrite the original result with the transliterated result and resort the results
  transliteratedResult.fuzzysortResults.forEach((res) => {
    const origIndex = result.fuzzysortResults.findIndex(
      (origRes) => origRes.obj.id === res.obj.id && origRes.score <= res.score
    );

    if (origIndex >= 0) result.fuzzysortResults[origIndex] = res;
  });

  result.fuzzysortResults.sort((a, b) => b.score - a.score);

  return result;
};
