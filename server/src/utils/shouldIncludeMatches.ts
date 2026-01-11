import { ContentType } from '../interfaces/interfaces';
import settingsService from '../services/settings-service';

/**
 * Determines if search metadata should be included for a given content type.
 * Checks content-type level setting first, then falls back to global config.
 */
export const shouldIncludeMatches = (contentType: ContentType): boolean => {
  const { includeMatches: globalIncludeMatches } = settingsService().get();
  return contentType.includeMatches ?? globalIncludeMatches ?? false;
};
