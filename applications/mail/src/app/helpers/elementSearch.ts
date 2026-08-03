import type { Filter, SearchParameters } from '@proton/shared/lib/mail/search';

export const isSearch = (searchParams: SearchParameters) =>
    !!searchParams.address ||
    !!searchParams.begin ||
    !!searchParams.end ||
    !!searchParams.from ||
    !!searchParams.keyword ||
    !!searchParams.to ||
    !!searchParams.wildcard;

export const isEmpty = (filter: Filter) => !Object.keys(filter).length;

export const hasAttachmentsFilter = (filter?: Filter) => filter?.Attachments === 1;
