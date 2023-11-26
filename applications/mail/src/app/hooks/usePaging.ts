import { useCallback } from 'react';

import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { pageCount } from '../helpers/paging';

export const usePaging = (
    inputPage: number,
    inputPageSize: MAIL_PAGE_SIZE,
    inputTotal: number | undefined,
    onPage: (page: number) => void
) => {
    const total = inputTotal === undefined ? 0 : pageCount(inputTotal, inputPageSize);
    const page = inputPage + 1;

    const handleNext = useCallback(
        () => onPage(inputPage === total - 1 ? total - 1 : inputPage + 1),
        [onPage, inputPage, total]
    );

    const handlePrevious = useCallback(() => onPage(inputPage === 0 ? 0 : inputPage - 1), [onPage, inputPage]);
    const handlePage = useCallback((newPage: number) => onPage(newPage - 1), [onPage]);
    const handleStart = useCallback(() => onPage(0), [onPage]);
    const handleEnd = useCallback(() => onPage(total - 1), [onPage, total]);

    return {
        onNext: handleNext,
        onPrevious: handlePrevious,
        onPage: handlePage,
        onStart: handleStart,
        onEnd: handleEnd,
        page,
        pageSize: inputPageSize,
        total,
    };
};
