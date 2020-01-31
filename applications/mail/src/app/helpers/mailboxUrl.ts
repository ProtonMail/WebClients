import { Sort, Filter, SearchParameters } from '../models/tools';
import { getSearchParams, changeSearchParams } from './url';
import { Location } from 'history';
import { getHumanLabelID } from './labels';
import { isNumber } from 'proton-shared/lib/helpers/validators';

export const setPathInUrl = (location: Location, labelID: string, elementID?: string): Location => {
    const urlFragment = elementID === undefined ? '' : `/${elementID}`;
    return {
        ...location,
        pathname: `/${getHumanLabelID(labelID)}${urlFragment}`
    };
};

const stringToPage = (string: string | undefined): number => {
    if (string === undefined) {
        return 0;
    }
    const pageNumber = parseInt(string, 10);
    if (!isNaN(pageNumber)) {
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
    return trimmed ? trimmed : undefined;
};

export const pageFromUrl = (location: Location) => stringToPage(getSearchParams(location).page);

export const sortFromUrl = (location: Location) => stringToSort(getSearchParams(location).sort);

export const filterFromUrl = (location: Location) => stringToFilter(getSearchParams(location).filter);

export const extractSearchParameters = (location: Location): SearchParameters => {
    const { address, from, to, keyword, begin, end, attachments, wildcard } = getSearchParams(location);
    return {
        address,
        from,
        to,
        keyword,
        begin: stringToInt(begin),
        end: stringToInt(end),
        attachments: stringToInt(attachments),
        wildcard: stringToInt(wildcard)
    };
};

export const setPageInUrl = (location: Location, page: number) =>
    changeSearchParams(location, { page: page === 0 ? undefined : String(page + 1) });

export const setSortInUrl = (location: Location, sort: Sort) =>
    changeSearchParams(location, { sort: sortToString(sort) });

export const setFilterInUrl = (location: Location, filter: Filter) =>
    changeSearchParams(location, { filter: filterToString(filter) });

export const setKeywordInUrl = (location: Location, keyword: string) =>
    changeSearchParams(location, { keyword: keywordToString(keyword) });
