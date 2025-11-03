import { useEffect, useRef, useState } from 'react';

import type { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import debounce from '@proton/utils/debounce';

import { pageCount } from '../helpers/paging';

const getTotalPagesCount = (currentTotalPages: number | undefined, inputPageSize: MAIL_PAGE_SIZE) =>
    currentTotalPages === undefined ? 0 : pageCount(currentTotalPages, inputPageSize);

const PAGE_CLICK_DEBOUNCE_TIMEOUT = 100;

export const usePaging = (
    currentPage: number,
    pageSize: MAIL_PAGE_SIZE,
    currentTotalPages: number | undefined,
    onChange: (page: number) => void
) => {
    const currentPageDisplay = currentPage + 1;
    const [page, setPage] = useState(currentPageDisplay);
    const [total, setTotal] = useState(() => getTotalPagesCount(currentTotalPages, pageSize));
    const debouncedOnchangeCallbackRef = useRef(
        debounce((callback: () => void) => {
            callback();
        }, PAGE_CLICK_DEBOUNCE_TIMEOUT)
    );

    const optimisticChange = (nextPage: number, currentPage: number) => {
        if (nextPage === currentPage) {
            return;
        }
        setPage(nextPage);
        const nextPageApiValue = nextPage - 1;
        debouncedOnchangeCallbackRef.current(() => onChange(nextPageApiValue));
    };

    useEffect(() => {
        if (currentPageDisplay !== page) {
            setPage(currentPageDisplay);
        }

        const newTotal = getTotalPagesCount(currentTotalPages, pageSize);
        if (total !== newTotal) {
            setTotal(newTotal);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-7BBA57
    }, [currentPage, currentTotalPages, pageSize, total]);

    return {
        onNext: () => {
            const nextPage = page === total ? total : page + 1;
            optimisticChange(nextPage, page);
        },
        onPrevious: () => {
            const nextPage = page === 1 ? 1 : page - 1;
            optimisticChange(nextPage, page);
        },
        onPage: (newPage: number) => {
            const nextPage = newPage;
            optimisticChange(nextPage, page);
        },
        onStart: () => {
            const nextPage = 1;
            optimisticChange(nextPage, page);
        },
        onEnd: () => {
            const nextPage = total;
            optimisticChange(nextPage, page);
        },
        page,
        pageSize: pageSize,
        total,
    };
};
