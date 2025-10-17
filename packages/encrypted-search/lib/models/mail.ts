import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';

export interface NormalizedSearchParams extends Omit<SearchParameters, 'wildcard' | 'keyword'> {
    labelIDs: string[];
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    normalizedKeywords: string[] | undefined;
}
