import { escapeRegex, getMatches } from '@proton/shared/lib/helpers/regex';
import { normalize } from '@proton/shared/lib/helpers/string';

export const matchChunks = (haystack: string, needle: string) => {
    if (!needle) return [];

    const searchWords = escapeRegex(normalize(needle)).trim().replace(/\s+/g, '|');
    const regex = new RegExp(searchWords, 'gi');
    return getMatches(regex, normalize(haystack));
};
