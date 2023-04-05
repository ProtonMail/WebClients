import { generatePath, match, matchPath } from 'react-router';

import { Location } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { changeSearchParams, getSearchParams } from '@proton/shared/lib/helpers/url';
import { isNumber } from '@proton/shared/lib/helpers/validators';

import { MAIN_ROUTE_PATH } from '../constants';
import { Filter, SearchParameters, Sort } from '../models/tools';
import { getHumanLabelID } from './labels';

// No interface to comply with generatePath argument type
export type MailUrlParams = {
    labelID: string;
    elementID?: string;
    messageID?: string;
};

export const getUrlPathname = (params: MailUrlParams) =>
    generatePath(MAIN_ROUTE_PATH, {
        ...params,
        // The as any is needed du to a bug into ExtractRouteParams inference which takes the `?` in the param name
        // Remove this once fixed
        labelID: getHumanLabelID(params.labelID),
    } as any);

export const setParamsInLocation = (location: Location, params: MailUrlParams): Location => ({
    ...location,
    pathname: getUrlPathname(params),
});

export const setParamsInUrl = (location: Location, params: MailUrlParams): string =>
    getUrlPathname(params) + location.search;

export const getParamsFromPathname = (pathname: string): match<MailUrlParams> =>
    matchPath(pathname, { path: MAIN_ROUTE_PATH }) as match<MailUrlParams>;

const stringToPage = (string: string | undefined): number => {
    if (string === undefined) {
        return 0;
    }
    const pageNumber = parseInt(string, 10);
    if (!Number.isNaN(pageNumber)) {
        return pageNumber - 1;
    }
    return 0;
};

const stringToSort = (string: string | undefined, labelID?: string): Sort => {
    const isScheduledLabel = labelID && labelID === MAILBOX_LABEL_IDS.SCHEDULED;
    switch (string) {
        case '-size':
            return { sort: 'Size', desc: true };
        case 'size':
            return { sort: 'Size', desc: false };
        case 'date':
            return { sort: 'Time', desc: !!isScheduledLabel };
        default:
            return { sort: 'Time', desc: !isScheduledLabel };
    }
};

const stringToInt = (string: string | undefined): number | undefined => {
    if (string === undefined) {
        return undefined;
    }
    return isNumber(string) ? parseInt(string, 10) : undefined;
};

export const sortToString = (sort: Sort): string | undefined =>
    sort.sort === 'Time' ? (sort.desc ? undefined : 'date') : sort.desc ? '-size' : 'size';

const stringToFilter = (string: string | undefined): Filter => {
    switch (string) {
        case 'read':
            return { Unread: 0 };
        case 'unread':
            return { Unread: 1 };
        case 'has-file':
            return { Attachments: 1 };
        default:
            return {};
    }
};

type FilterStatus = 'has-file' | 'unread' | 'read';
export const filterToString = (filter: Filter): FilterStatus | undefined => {
    if (filter.Attachments === 1) {
        return 'has-file';
    }

    if (filter.Unread === 1) {
        return 'unread';
    }

    if (filter.Unread === 0) {
        return 'read';
    }

    return undefined;
};

export const keywordToString = (keyword: string): string | undefined => {
    const trimmed = keyword.trim();
    return trimmed || undefined;
};

export const pageFromUrl = (location: Location) => stringToPage(getSearchParams(location.hash).page);

export const sortFromUrl = (location: Location, labelID?: string) =>
    stringToSort(getSearchParams(location.hash).sort, labelID);

export const filterFromUrl = (location: Location) => stringToFilter(getSearchParams(location.hash).filter);

export const extractSearchParameters = (location: Location): SearchParameters => {
    const { address, from, to, keyword, begin, end, wildcard } = getSearchParams(location.hash);
    return {
        address,
        from,
        to,
        keyword,
        begin: stringToInt(begin),
        end: stringToInt(end),
        wildcard: stringToInt(wildcard),
    };
};

export const setPageInUrl = (location: Location, page: number) =>
    changeSearchParams(location.pathname, location.hash, { page: page === 0 ? undefined : String(page + 1) });

export const setSortInUrl = (location: Location, sort: Sort) =>
    changeSearchParams(location.pathname, location.hash, { page: undefined, sort: sortToString(sort) });

export const setFilterInUrl = (location: Location, filter: Filter) =>
    changeSearchParams(location.pathname, location.hash, { page: undefined, filter: filterToString(filter) });

export const setKeywordInUrl = (location: Location, keyword: string) =>
    changeSearchParams(location.pathname, location.hash, { page: undefined, keyword: keywordToString(keyword) });
