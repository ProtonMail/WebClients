import { useEffect, useState } from 'react';
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

    const handleNext = () => onPage(inputPage === total - 1 ? total - 1 : inputPage + 1);
    const handlePrevious = () => onPage(inputPage === 0 ? 0 : inputPage - 1);
    const handlePage = (newPage: number) => onPage(newPage - 1);
    const handleStart = () => onPage(0);
    const handleEnd = () => onPage(total - 1);

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
