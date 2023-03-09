import { RefObject, useEffect } from 'react';

// Scroll to top of list when page or label changes
const useScrollToTop = (ref: RefObject<HTMLElement>, page: number, labelID: string) => {
    const scrollTop = () => {
        if (ref && ref.current) {
            ref.current.scrollTop = 0;
        }
    };

    useEffect(() => {
        scrollTop();
    }, [page, labelID]);
};

export default useScrollToTop;
