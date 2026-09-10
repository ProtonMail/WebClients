import type { Filter, SearchParameters } from '@proton/shared/lib/mail/search';

export const isSearch = (searchParams: SearchParameters) =>
    !!searchParams.address ||
    !!searchParams.begin ||
    !!searchParams.end ||
    !!searchParams.from ||
    !!searchParams.keyword ||
    !!searchParams.to ||
    !!searchParams.wildcard;

/**
 * Every criterion a search is made of. The `satisfies` makes adding a field to `SearchParameters`
 * a compile error here, so a new criterion can't silently drop out of the comparison below.
 */
const SEARCH_KEYS = Object.keys({
    address: true,
    begin: true,
    end: true,
    from: true,
    keyword: true,
    to: true,
    wildcard: true,
} satisfies Record<keyof SearchParameters, true>) as (keyof SearchParameters)[];

/** Compares the criteria themselves, not the object identity: two separately parsed URLs match. */
export const isSameSearch = (a: SearchParameters, b: SearchParameters) => SEARCH_KEYS.every((key) => a[key] === b[key]);

export const isEmpty = (filter: Filter) => !Object.keys(filter).length;

export const hasAttachmentsFilter = (filter?: Filter) => filter?.Attachments === 1;
