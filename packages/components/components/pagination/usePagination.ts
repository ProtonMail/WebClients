import { useState, useEffect } from 'react';

const usePagination = <T>(initialList: T[] = [], initialPage = 1, limit = 10) => {
    const [page, setPage] = useState(initialPage);
    const onNext = () => setPage(page + 1);
    const onPrevious = () => setPage(page - 1);
    const onSelect = (p: number) => setPage(p);
    const list = [...initialList].splice((page - 1) * limit, limit);
    const lastPage = Math.ceil(initialList.length / limit);
    const isLastPage = page === lastPage;

    useEffect(() => {
        if (lastPage && page > lastPage) {
            onSelect(lastPage);
        }
    }, [initialList.length]);

    return {
        page,
        isLastPage,
        list,
        onNext,
        onPrevious,
        onSelect,
    };
};

export default usePagination;
