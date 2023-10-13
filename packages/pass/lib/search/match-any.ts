import { normalize } from '@proton/shared/lib/helpers/string';

export const matchAny = (terms: string[]) => (match: string) => {
    const normalizedSearchTerm = normalize(match, true);
    return normalizedSearchTerm.split(' ').every((word) => terms.some((s) => normalize(s, true).includes(word)));
};
