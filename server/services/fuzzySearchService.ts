import fuzzysort from 'fuzzysort';
import { transliterate } from 'transliteration';
import {
  ContentType,
  Entry,
  FuzzySortOptions,
  Result,
} from '../interfaces/interfaces';
import { validateQuery } from './validationService';

const weightScores = (
  a: readonly Fuzzysort.KeyResult<Entry>[],
  keys: FuzzySortOptions['keys']
) => {
  const weightedScores = keys.map((key, index) => {
    const weight = key.weight || 0;
    // return lowest score
    return a[index] ? +a[index].score + weight : -9999;
  });

  return Math.max(...weightedScores);
};

export const buildResult = ({
  entries,
  fuzzysortOptions,
  keys,
  query,
}: {
  entries: Entry[];
  fuzzysortOptions: FuzzySortOptions;
  keys: string[];
  query: string;
}) => {
  if (fuzzysortOptions.characterLimit) {
    entries.forEach((entry) => {
      const entryKeys = Object.keys(entry);

      entryKeys.forEach((key) => {
        if (!keys.includes(key)) return;

        if (!entry[key]) return;

        entry[key] = entry[key].slice(0, fuzzysortOptions.characterLimit);
      });
    });
  }

  return fuzzysort.go<Entry>(query, entries, {
    threshold: fuzzysortOptions.threshold,
    limit: fuzzysortOptions.limit,
    keys,
    scoreFn: (a) => weightScores(a, fuzzysortOptions.keys),
  });
};

export const buildTransliteratedResult = ({
  entries,
  fuzzysortOptions,
  keys,
  query,
  result,
}: {
  entries: Entry[];
  fuzzysortOptions: FuzzySortOptions;
  keys: string[];
  query: string;
  result: Fuzzysort.KeysResults<Entry>;
}) => {
  const { keys: fuzzysortKeys, threshold, limit } = fuzzysortOptions;

  /**
   * Transliterate relevant fields for the entry
   */
  entries.forEach((entry: Record<string, any>) => {
    const entryKeys = Object.keys(entry);

    entry.transliterations = {};

    entryKeys.forEach((key) => {
      if (!keys.includes(key) || !entry[key]) return;

      entry.transliterations[key] = transliterate(entry[key]);
    });
  });

  const transliterationKeys = keys.map((key) => `transliterations.${key}`);

  const transliteratedResult = fuzzysort.go<Entry>(query, entries, {
    threshold,
    limit,
    keys: transliterationKeys,
    scoreFn: (a) => weightScores(a, fuzzysortKeys),
  });

  const previousResults = result;

  if (!previousResults.total) return transliteratedResult;

  const newResults = [...previousResults] as any[];

  // In the chance that a transliterated result scores higher than its non-transliterated counterpart,
  // overwrite the original result with the transliterated result and resort the results
  transliteratedResult.forEach((res) => {
    const origIndex = previousResults.findIndex(
      (origRes) => origRes.obj.id === res.obj.id && origRes.score <= res.score
    );

    if (origIndex >= 0) newResults[origIndex] = res;
  });

  newResults.sort((a, b) => b.score - a.score);

  return result;
};

export default async function getResult(
  contentType: ContentType,
  query: string,
  // Need to type filters as any, as Strapi doesn't expose the Filter type
  filters?: any,
  locale?: string
): Promise<Result> {
  const buildFilteredEntry = async () => {
    await validateQuery(contentType, locale);

    return (await strapi.entityService.findMany(contentType.uid, {
      ...(filters && { filters }),
      ...(locale && { locale }),
    })) as unknown as Entry[];
  };

  const filteredEntries = await buildFilteredEntry();

  const keys = contentType.fuzzysortOptions.keys.map((key) => key.name);

  let result = buildResult({
    entries: filteredEntries,
    fuzzysortOptions: contentType.fuzzysortOptions,
    keys,
    query,
  });

  if (contentType.transliterate) {
    result = buildTransliteratedResult({
      entries: filteredEntries,
      fuzzysortOptions: contentType.fuzzysortOptions,
      keys,
      query,
      result,
    });
  }

  return {
    fuzzysortResults: result,
    schema: contentType,
  };
}
