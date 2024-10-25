import type { MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useHandler } from './useHandler';

export interface ContactFocusContext {
    elementIDs: string[];
    listRef: MutableRefObject<HTMLElement | null>;
}

export const useContactFocus = ({ elementIDs, listRef }: ContactFocusContext) => {
    const [focusIndex, setFocusIndex] = useState<number>();

    const getFocusedId = () => (focusIndex !== undefined ? elementIDs[focusIndex] : undefined);

    const focusedIDRef = useRef(getFocusedId());

    const handleFocus = useHandler((index) => {
        setFocusIndex(index);
    });

    const focusOnElementByIndex = (index: number) => {
        const element = listRef.current?.querySelector(
            `[data-shortcut-target="contact-container"][data-element-id="${elementIDs[index]}"]`
        ) as HTMLElement;
        element?.focus();
    };

    useEffect(() => {
        if (focusIndex !== undefined) {
            focusOnElementByIndex(focusIndex);
        }

        focusedIDRef.current = getFocusedId();
    }, [focusIndex]);

    return {
        focusIndex,
        getFocusedId,
        setFocusIndex,
        handleFocus,
    };
};
