import { useRef } from 'react';

import { type HotkeyTuple, useHotkeys } from './useHotkeys';

export interface ContactHotkeysContext {
    elementIDs: string[];
    focusIndex?: number;
}

export interface ContactHotkeysHandlers {
    getFocusedId: () => string | undefined;
    setFocusIndex: (index?: number) => void;
    handleElement: (ID: string) => void;
}

export const useContactHotkeys = (
    { elementIDs, focusIndex }: ContactHotkeysContext,
    { getFocusedId, setFocusIndex, handleElement }: ContactHotkeysHandlers
) => {
    const elementRef = useRef<HTMLDivElement>(null);

    const shortcutHandlers: HotkeyTuple[] = [
        [
            'ArrowUp',
            (e) => {
                e.preventDefault();
                const previousIndex = focusIndex !== undefined ? Math.max(0, focusIndex - 1) : elementIDs.length - 1;
                setFocusIndex(previousIndex);
            },
        ],
        [
            'ArrowDown',
            (e) => {
                e.preventDefault();
                const nextIndex = focusIndex !== undefined ? Math.min(elementIDs.length - 1, focusIndex + 1) : 0;
                setFocusIndex(nextIndex);
            },
        ],
        [
            'Enter',
            (e) => {
                const id = getFocusedId();
                const { activeElement } = document;

                if (id && activeElement?.tagName.toLocaleLowerCase() !== 'button') {
                    e.stopPropagation();
                    handleElement(id);
                }
            },
        ],
    ];

    useHotkeys(elementRef, shortcutHandlers);

    return elementRef;
};
