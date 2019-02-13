import { useState } from 'react';

const usePagination = (initialList = [], initialPage = 1, limit = 10) => {
    const [page, setPage] = useState(initialPage);
    const onNext = () => setPage(page + 1);
    const onPrevious = () => setPage(page - 1);
    const onSelect = (p) => () => setPage(p);
    const list = [...initialList].splice((page - 1) * limit, limit);

    return {
        page,
        list,
        onNext,
        onPrevious,
        onSelect
    };
};

export default usePagination;