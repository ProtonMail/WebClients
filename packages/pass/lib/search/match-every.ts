import { normalize } from '@proton/shared/lib/helpers/string';

/** Searches for occurrences of the normalized `value` in
 * the provided needles. Needles should already be normalized.
 * Early termination is implicit via `some`. */
export const matchEvery =
    (needles: string[]) =>
    (haystack: string): boolean => {
        if (needles.length === 0) return false;
        const normalizedHaystack = normalize(haystack, true);
        return needles.every((needle) => normalizedHaystack.includes(needle));
    };
