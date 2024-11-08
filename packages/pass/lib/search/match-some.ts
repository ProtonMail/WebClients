import { normalize } from '@proton/shared/lib/helpers/string';

/** Searches for occurrences of the normalized `value` in
 * the provided needles. Needles should already be normalized.
 * Early termination is implicit via `some`. */
export const matchSome =
    (needles: string[]) =>
    (haystack: string): boolean => {
        if (needles.length === 0) return false;
        const normalizedHaystack = normalize(haystack, true);
        return needles.some((needle) => normalizedHaystack.includes(needle));
    };
