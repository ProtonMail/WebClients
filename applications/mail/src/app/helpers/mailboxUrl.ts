import { Location } from 'history';
import { match, matchPath, generatePath } from 'react-router';
import { isNumber } from 'proton-shared/lib/helpers/validators';
import { getSearchParams, changeSearchParams } from 'proton-shared/lib/helpers/url';
import { Sort, Filter, SearchParameters } from '../models/tools';
import { getHumanLabelID } from './labels';
import { MAIN_ROUTE_PATH } from '../constants';

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

const stringToSort = (string: string | undefined): Sort => {
    switch (string) {
        case '-size':
            return { sort: 'Size', desc: true };
        case 'size':
            return { sort: 'Size', desc: false };
        case 'date':
            return { sort: 'Time', desc: false };
        default:
            return { sort: 'Time', desc: true };
    }
};

const stringToInt = (string: string | undefined): number | undefined => {
    if (string === undefined) {
        return undefined;
    }
    return isNumber(string) ? parseInt(string, 10) : undefined;
};

const sortToString = (sort: Sort): string | undefined =>
    sort.sort === 'Time' ? (sort.desc ? undefined : 'date') : sort.desc ? '-size' : 'size';

const stringToFilter = (string: string | undefined): Filter => {
    switch (string) {
        case 'read':
            return { Unread: 0 };
        case 'unread':
            return { Unread: 1 };
        default:
            return {};
    }
};

const filterToString = (filter: Filter): string | undefined =>
    filter.Unread === undefined ? undefined : filter.Unread === 0 ? 'read' : 'unread';

export const keywordToString = (keyword: string): string | undefined => {
    const trimmed = keyword.trim();
    return trimmed || undefined;
};

export const pageFromUrl = (location: Location) => stringToPage(getSearchParams(location.search).page);

export const sortFromUrl = (location: Location) => stringToSort(getSearchParams(location.search).sort);

export const filterFromUrl = (location: Location) => stringToFilter(getSearchParams(location.search).filter);

export const extractSearchParameters = (location: Location): SearchParameters => {
    const { address, from, to, keyword, begin, end, attachments, wildcard } = getSearchParams(location.search);
    return {
        address,
        from,
        to,
        keyword,
        begin: stringToInt(begin),
        end: stringToInt(end),
        attachments: stringToInt(attachments),
        wildcard: stringToInt(wildcard),
    };
};

export const setPageInUrl = (location: Location, page: number) =>
    changeSearchParams(location.pathname, location.search, { page: page === 0 ? undefined : String(page + 1) });

export const setSortInUrl = (location: Location, sort: Sort) =>
    changeSearchParams(location.pathname, location.search, { page: undefined, sort: sortToString(sort) });

export const setFilterInUrl = (location: Location, filter: Filter) =>
    changeSearchParams(location.pathname, location.search, { page: undefined, filter: filterToString(filter) });

export const setKeywordInUrl = (location: Location, keyword: string) =>
    changeSearchParams(location.pathname, location.search, { page: undefined, keyword: keywordToString(keyword) });
