import { useCallback, useState } from 'react';

export const useLocalPagination = () => {
    const [currentPage, setCurrentPage] = useState(0);

    const handleNext = useCallback(() => {
        setCurrentPage((prev) => prev + 1);
    }, []);

    const handlePrev = useCallback(() => {
        setCurrentPage((prev) => (prev > 0 ? prev - 1 : 0));
    }, []);

    const handleGoFirst = useCallback(() => {
        setCurrentPage(0);
    }, []);

    return { currentPage, handleNext, handlePrev, handleGoFirst };
};
