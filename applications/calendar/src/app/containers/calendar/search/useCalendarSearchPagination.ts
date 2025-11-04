import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
    extractSearchParameters,
    generatePathnameWithSearchParams,
    parseSearchParams,
} from '../../../helpers/encryptedSearch/esUtils';
import { DEFAULT_MAX_ITEMS_PER_PAGE } from './constants';
import type { VisualSearchItem } from './interface';

const getInitialPage = (items: VisualSearchItem[], maxItemsPerPage = DEFAULT_MAX_ITEMS_PER_PAGE) => {
    const index = items.findIndex(({ isClosestToDate }) => isClosestToDate);

    return index === -1 ? 0 : Math.floor(index / maxItemsPerPage);
};

export const useCalendarSearchPagination = (
    items: VisualSearchItem[],
    date: Date,
    maxItemsPerPage = DEFAULT_MAX_ITEMS_PER_PAGE
) => {
    const history = useHistory();
    const isFirstRenderRef = useRef(true);
    const [currentPage, setCurrentPage] = useState(getInitialPage(items, maxItemsPerPage));

    const maxPage = Math.ceil(items.length / maxItemsPerPage) - 1;
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
        /**
         * This useEffect is in charge of setting the page that contains the closest item to the selected date in case
         * the selected date gets changed.
         */
        if (isFirstRenderRef.current) {
            // no need to do anything
            isFirstRenderRef.current = false;
            return;
        }

        const { keyword, begin, end, page } = extractSearchParameters(history.location);
        if (page !== undefined) {
            // If a page was visible, we will remove it because the user is now navigating by selected date (and not by page)
            history.push(
                generatePathnameWithSearchParams(history.location, {
                    keyword,
                    begin: begin ? String(begin) : undefined,
                    end: end ? String(end) : undefined,
                })
            );
        }
        setCurrentPage(getInitialPage(items, maxItemsPerPage));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-FDAB62
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
