import { useCallback, useEffect, useRef } from 'react';

interface UseItemVisibilityOptions {
    onItemRender?: (uid: string) => void;
    threshold?: number;
    rootMargin?: string;
}

export const useItemVisibility = ({ onItemRender, threshold = 0.1, rootMargin = '50px' }: UseItemVisibilityOptions) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const observedItemsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!onItemRender) {
            return;
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const itemUid = entry.target.getAttribute('data-item-uid');

                        if (itemUid && !observedItemsRef.current.has(itemUid)) {
                            onItemRender(itemUid);
                            observedItemsRef.current.add(itemUid);
                        }
                    }
                });
            },
            {
                threshold,
                rootMargin,
            }
        );

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [onItemRender, threshold, rootMargin]);

    const observeElement = useCallback((element: HTMLElement | null, uid: string) => {
        if (!element || !observerRef.current) {
            return;
        }

        element.setAttribute('data-item-uid', uid);

        observerRef.current.observe(element);
    }, []);

    return {
        observeElement,
    };
};
