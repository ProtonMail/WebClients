import { useState, useEffect } from 'react';

const usePagination = <T>(initialList: T[] = [], initialPage = 1, limit = 10) => {
    const [page, setPage] = useState(initialPage);
    const onNext = () => setPage(page + 1);
    const onPrevious = () => setPage(page - 1);
    const onSelect = (p: number) => setPage(p);
    const list = [...initialList].splice((page - 1) * limit, limit);

    useEffect(() => {
        const lastPage = Math.ceil(initialList.length / limit);
        if (lastPage && page > lastPage) {
            onSelect(lastPage);
        }
    }, [initialList.length]);

    return {
        page,
        list,
        onNext,
        onPrevious,
        onSelect,
    };
};

export default usePagination;
