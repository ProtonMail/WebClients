import { escapeRegex, getMatches } from '@proton/shared/lib/helpers/regex';
import { normalize } from '@proton/shared/lib/helpers/string';

export const getItemNameSearchChunks = (itemName: string, search: string) => {
    if (!search) return [];

    const searchWords = escapeRegex(normalize(search)).trim().replace(/\s+/g, '|');
    const regex = new RegExp(searchWords, 'gi');
    return getMatches(regex, normalize(itemName));
};
