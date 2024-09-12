import type { DependencyList, RefObject } from 'react';
import { useEffect, useState } from 'react';

import debounce from '@proton/utils/debounce';

export const useHasScroll = (ref: RefObject<HTMLElement>, dependencies: DependencyList = []) => {
    const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false);
    const [hasHorizontalScrollbar, setHasHorizontalScrollbar] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const handleResize = () => {
            const element = ref.current;
            if (!element) {
                return;
            }

            setHasVerticalScrollbar(element.scrollHeight > element.clientHeight);
            setHasHorizontalScrollbar(element.scrollWidth > element.clientWidth);
        };

        // Initial check
        handleResize();

        const debouncedHandleResize = debounce(handleResize, 100);
        element.addEventListener('resize', debouncedHandleResize);

        // Must add an observer because nor resize or scroll event are enough
        const observer = new MutationObserver(debouncedHandleResize);
        observer.observe(element, { attributes: true, childList: true, subtree: true });
        return () => {
            element.removeEventListener('resize', debouncedHandleResize);
            observer.disconnect();
        };
    }, dependencies);

    return [hasVerticalScrollbar, hasHorizontalScrollbar];
};
