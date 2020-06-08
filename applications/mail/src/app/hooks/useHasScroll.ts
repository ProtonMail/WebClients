import { RefObject, useEffect, useState } from 'react';
import { useHandler } from './useHandler';

export const useHasScroll = (ref: RefObject<HTMLElement>) => {
    const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false);
    const [hasHorizontalScrollbar, setHasHorizontalScrollbar] = useState(false);

    const handleResize = useHandler(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        setHasVerticalScrollbar(element.scrollHeight > element.clientHeight);
        setHasHorizontalScrollbar(element.scrollWidth > element.clientWidth);
    });

    useEffect(() => {
        handleResize();

        const element = ref.current;
        if (!element) {
            return;
        }

        element.addEventListener('resize', handleResize);
        // Must add an observer because nor resize or scroll event are enough
        const observer = new MutationObserver(handleResize);
        observer.observe(element, { attributes: true, childList: true, subtree: true });
        return () => {
            element.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, []);

    return [hasVerticalScrollbar, hasHorizontalScrollbar];
};
