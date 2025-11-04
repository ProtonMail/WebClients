import type { DependencyList, RefObject } from 'react';
import { useEffect } from 'react';

// Scroll to top of list when page or label changes
const useScrollToTop = (ref: RefObject<HTMLElement>, dependencies: DependencyList) => {
    const scrollTop = () => {
        if (ref.current && ref.current.scrollTop !== 0) {
            ref.current.scrollTop = 0;
        }
    };

    useEffect(() => {
        scrollTop();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-852D6B
    }, dependencies);
};

export default useScrollToTop;
