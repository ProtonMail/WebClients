import { useRef } from 'react';

export const useScrollToItem = () => {
    const itemRefs = useRef<Record<string, HTMLElement | null>>({});

    const scrollToItem = (itemId?: string) => {
        if (!itemId) {
            return;
        }

        const element = itemRefs.current[itemId];
        if (!element) {
            return;
        }

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
        });
    };

    const addRef = (itemId: string, element: HTMLElement | null) => {
        itemRefs.current[itemId] = element;
    };

    return { scrollToItem, addRef };
};
