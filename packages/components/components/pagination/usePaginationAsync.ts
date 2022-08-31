import { useState } from 'react';

const usePaginationAsync = (initialPage = 1) => {
    const [page, setPage] = useState(initialPage);
    const onNext = () => setPage(page + 1);
    const onPrevious = () => setPage(page - 1);
    const onSelect = (p: number) => setPage(p);
    const reset = () => setPage(initialPage);

    return {
        page,
        onNext,
        onPrevious,
        onSelect,
        reset,
    };
};

export default usePaginationAsync;
