import { normalize } from '@proton/shared/lib/helpers/string';

export const matchAny = (terms: string[]) => (match: string) => {
    const normalizedSearchTerm = normalize(match, true);
    return terms.map((s) => normalize(s, true)).some((s) => s.includes(normalizedSearchTerm));
};
