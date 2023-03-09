import { DependencyList, RefObject, useEffect } from 'react';

// Scroll to top of list when page or label changes
const useScrollToTop = (ref: RefObject<HTMLElement>, dependencies: DependencyList) => {
    const scrollTop = () => {
        if (ref.current && ref.current.scrollTop !== 0) {
            ref.current.scrollTop = 0;
        }
    };

    useEffect(() => {
        scrollTop();
    }, dependencies);
};

export default useScrollToTop;
