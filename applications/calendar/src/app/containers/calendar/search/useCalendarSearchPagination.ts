import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
    extractSearchParametersFromURL,
    generatePathnameWithSearchParams,
    parseSearchParams,
} from '../../../helpers/encryptedSearch/esUtils';

export const useCalendarSearchPagination = <T>(items: T[], maxItemsPerPage = 100) => {
    const maxPage = Math.floor(items.length / maxItemsPerPage);
    const [currentPage, setCurrentPage] = useState(0);
    const history = useHistory();

    const isPreviousEnabled = currentPage > 0;
    const isNextEnabled = currentPage < maxPage;

    const setPage = (page: number) => {
        setCurrentPage(page);
        history.push(
            generatePathnameWithSearchParams(history.location, {
                ...extractSearchParametersFromURL(history.location),
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

    return {
        currentPage,
        first: () => setPage(0),
        previous: () => setPage(isPreviousEnabled ? currentPage - 1 : currentPage),
        next: () => setPage(isNextEnabled ? currentPage + 1 : currentPage),
        items: items.slice(currentPage * maxItemsPerPage, (currentPage + 1) * maxItemsPerPage),
        isPreviousEnabled,
        isNextEnabled,
    };
};
