import { useCallback, useEffect, useState } from 'react';
import { pageCount } from '../helpers/paging';

export const usePaging = (inputPage: number, inputTotal: number | undefined, onPage: (page: number) => void) => {
    const getPage = () => inputPage + 1;
    const getTotal = () => (inputTotal === undefined ? 0 : pageCount(inputTotal));

    const [page, setPage] = useState(getPage);
    const [total, setTotal] = useState(getTotal);

    // Willingly delay updates of page and total values to wait for view content to update alongside
    useEffect(() => {
        setPage(getPage);
        setTotal(getTotal);
    }, [inputPage, inputTotal]);

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
        total,
    };
};
