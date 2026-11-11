import { useEffect, useState } from 'react';

const getTextWidth = (element: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return Array.from(range.getClientRects()).reduce((width, rect) => width + rect.width, 0);
};

export const useIsTextTruncated = <T extends HTMLElement>() => {
    const [element, setElement] = useState<T | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        if (!element) {
            return;
        }
        const observer = new ResizeObserver(() => {
            setIsTruncated(getTextWidth(element) > element.getBoundingClientRect().width);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);

    return { ref: setElement, isTruncated };
};
