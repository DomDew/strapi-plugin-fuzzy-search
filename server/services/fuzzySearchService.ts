import { WhereQuery } from '@strapi/utils/dist/convert-query-params';
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
  keys: FuzzySortOptions['keys'],
) => {
  const weightedScores = keys.map((key, index) => {
    const weight = key.weight || 0;
    // return lowest score
    return a[index] ? +a[index].score + weight : -9999;
  });

  return Math.max(...weightedScores);
};

const limitCharacters = (
  entries: Entry[],
  characterLimit: number,
  keys: string[],
) =>
  entries.map((entry) => {
    const limitedEntry = { ...entry };
    const entryKeys = Object.keys(limitedEntry);

    entryKeys.forEach((key) => {
      if (!keys.includes(key)) return;

      limitedEntry[key] = limitedEntry[key]
        ? limitedEntry[key].slice(0, characterLimit)
        : limitedEntry[key];
    });

    return limitedEntry;
  });

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
  const modifiedEntries = fuzzysortOptions.characterLimit
    ? limitCharacters(entries, fuzzysortOptions.characterLimit, keys)
    : entries;

  return fuzzysort.go<Entry>(query, modifiedEntries, {
    threshold: fuzzysortOptions.threshold,
    limit: fuzzysortOptions.limit,
    keys,
    scoreFn: (a) => weightScores(a, fuzzysortOptions.keys),
  });
};

const transliterateEntries = (entries: Entry[]) =>
  entries.map((entry) => {
    const entryKeys = Object.keys(entry);

    entry.transliterations = {};

    entryKeys.forEach((key) => {
      if (!entry[key]) return;

      entry.transliterations[key] = transliterate(entry[key]);
    });

    return entry;
  });

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

  const transliteratedEntries = transliterateEntries(entries);

  const transliterationKeys = keys.map((key) => `transliterations.${key}`);

  const transliteratedResult = fuzzysort.go<Entry>(
    query,
    transliteratedEntries,
    {
      threshold,
      limit,
      keys: transliterationKeys,
      scoreFn: (a) => weightScores(a, fuzzysortKeys),
    },
  );

  // Remove transliterations key from entries
  entries.forEach((entry) => delete entry.transliterations);

  if (!result.total) return transliteratedResult;

  const newResults = [...result];

  // In the chance that a transliterated result scores higher than its non-transliterated counterpart,
  // overwrite the original result with the transliterated result and resort the results
  transliteratedResult.forEach((res) => {
    const origIndex = newResults.findIndex(
      (origRes) => origRes.obj.id === res.obj.id && origRes.score <= res.score,
    );

    if (origIndex >= 0) newResults[origIndex] = res;
  });

  newResults.sort((a, b) => b.score - a.score);

  /**
   * Typecasting here, as newResults is inferred as Fuzzysort.KeysResult<Entry>[] instead of Fuzzysort.KeysResults<Entry>.
   * Typecasting newResults during creation as Fuzzysort.KeysResults<Entry> results in a type error, as the KeysResults type is readonly
   * but needs to be mutable for the sort function.
   */
  return newResults as unknown as Fuzzysort.KeysResults<Entry>;
};

export default async function getResult(
  contentType: ContentType,
  query: string,
  filters?: WhereQuery,
  locale?: string,
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
