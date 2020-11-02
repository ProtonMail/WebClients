import { useEffect, useState } from 'react';
import { pageCount } from '../helpers/paging';
import { Page } from '../models/tools';

export const usePaging = (inputPage: Page, onPage: (page: number) => void) => {
    const getPage = () => inputPage.page + 1;
    const getTotal = () => pageCount(inputPage);

    const [page, setPage] = useState(getPage);
    const [total, setTotal] = useState(getTotal);

    // Willingly delay updates of page and total values to wait for view content to update alongside
    useEffect(() => {
        setPage(getPage);
        setTotal(getTotal);
    }, [inputPage]);

    const handleNext = () => onPage(inputPage.page + 1);
    const handlePrevious = () => onPage(inputPage.page - 1);
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
