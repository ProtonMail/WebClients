import { useState } from 'react';

const usePaginationAsync = (initialPage = 1) => {
    const [page, setPage] = useState(initialPage);
    const onNext = () => setPage(page + 1);
    const onPrevious = () => setPage(page - 1);
    const onSelect = (p) => () => setPage(p);

    return {
        page,
        onNext,
        onPrevious,
        onSelect
    };
};

export default usePaginationAsync;