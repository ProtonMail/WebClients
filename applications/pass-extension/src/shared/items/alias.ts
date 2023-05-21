import { normalize } from '@proton/shared/lib/helpers/string';

/* Normalize unicode representation of the string
 * Remove diacritics (accents) + 20 max characters length
 * for the auto-derived alias name */
export const deriveAliasPrefix = (name: string) =>
    normalize(name, true)
        .replace(/[^a-z0-9\-\_.]/g, '')
        .slice(0, 20);
