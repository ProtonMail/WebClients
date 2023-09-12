import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
    extractSearchParameters,
    generatePathnameWithSearchParams,
    parseSearchParams,
} from '../../../helpers/encryptedSearch/esUtils';
import { DEFAULT_MAX_ITEMS_PER_PAGE } from './constants';
import { VisualSearchItem } from './interface';

const getInitialPage = (items: VisualSearchItem[], maxItemsPerPage = DEFAULT_MAX_ITEMS_PER_PAGE) => {
    const index = items.findIndex(({ isClosestToDate }) => isClosestToDate);

    return index === -1 ? 0 : Math.floor(index / maxItemsPerPage);
};

export const useCalendarSearchPagination = (
    items: VisualSearchItem[],
    date: Date,
    maxItemsPerPage = DEFAULT_MAX_ITEMS_PER_PAGE
) => {
    const maxPage = Math.floor(items.length / maxItemsPerPage);
    const [currentPage, setCurrentPage] = useState(getInitialPage(items, maxItemsPerPage));
    const history = useHistory();

    const isPreviousEnabled = currentPage > 0;
    const isNextEnabled = currentPage < maxPage;

    const setPage = (page: number) => {
        setCurrentPage(page);
        const searchParams = extractSearchParameters(history.location);

        history.push(
            generatePathnameWithSearchParams(history.location, {
                keyword: searchParams.keyword,
                begin: searchParams.begin ? String(searchParams.begin) : undefined,
                end: searchParams.end ? String(searchParams.end) : undefined,
                ...(!!page && { page: page.toString() }),
            })
        );
    };

    useEffect(() => {
        const { esSearchParams } = parseSearchParams(history.location);
        if (esSearchParams?.page) {
            setCurrentPage(esSearchParams?.page);
        }
    }, [history.location]);

    useEffect(() => {
        // on each new search, or if users change the selecte date, re-compute initial page
        setCurrentPage(getInitialPage(items, maxItemsPerPage));
    }, [items, date]);

    const paginatedItems = useMemo(
        () => items.slice(currentPage * maxItemsPerPage, (currentPage + 1) * maxItemsPerPage),
        [items, currentPage, maxItemsPerPage]
    );

    return {
        currentPage,
        first: () => setPage(0),
        previous: () => setPage(isPreviousEnabled ? currentPage - 1 : currentPage),
        next: () => setPage(isNextEnabled ? currentPage + 1 : currentPage),
        items: paginatedItems,
        isPreviousEnabled,
        isNextEnabled,
    };
};
