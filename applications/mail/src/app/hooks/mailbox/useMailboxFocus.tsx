import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useHandler } from '@proton/components';
import useIsMounted from '@proton/hooks/useIsMounted';

import type { Filter, Sort } from 'proton-mail/models/tools';

export interface MailboxFocusContext {
    elementIDs: string[];
    page: number;
    filter: Filter;
    sort: Sort;
    showList: boolean; // Column is visible
    listRef: MutableRefObject<HTMLElement | null>;
    labelID: string;
    isComposerOpened: boolean;
}

export const useMailboxFocus = ({
    elementIDs,
    page,
    filter,
    sort,
    showList,
    listRef,
    labelID,
    isComposerOpened,
}: MailboxFocusContext) => {
    const isMounted = useIsMounted();
    const [focusIndex, setFocusIndex] = useState<number>();

    const getFocusedId = useCallback(
        () => (focusIndex !== undefined ? elementIDs[focusIndex] : undefined),
        [focusIndex, elementIDs]
    );

    const labelIDRef = useRef(labelID); // It corresponds to the current location
    const focusedIDRef = useRef(getFocusedId());

    const handleFocus = useHandler((index) => setFocusIndex(index));

    const focusOnElementByIndex = (index: number) => {
        // Selecting on index may fail during loading time with placeholders
        // Selecting by sibblings is a bit more stable but we have to skip "ListSettings"
        const element = listRef.current?.querySelector(
            `[data-shortcut-target="item-container-wrapper"]:nth-child(${
                index + 1
            }) [data-shortcut-target="item-container"]`
        ) as HTMLElement;
        if (!element) {
            return;
        }
        // Skip focus if the element is already focused
        if (element === document.activeElement) {
            return;
        }
        // Scroll into view only when we reset index to 0
        if (index === 0) {
            element.scrollIntoView();
        }
        element.focus();
    };

    const resetFocusIndex = useCallback(() => {
        if (elementIDs.length) {
            setFocusIndex(0);
            focusOnElementByIndex(0);
        } else {
            setFocusIndex(undefined);
        }

        focusedIDRef.current = undefined;
    }, [elementIDs]);

    const focusOnLastMessage = useCallback(() => {
        const messages = document.querySelectorAll('[data-shortcut-target="message-container"]');
        if (messages.length) {
            const lastMessage = messages[messages.length - 1] as HTMLElement;
            lastMessage.focus();
            setFocusIndex(undefined);
            return;
        }
        const trashWarning = document.querySelector('[data-shortcut-target="trash-warning"]') as HTMLElement;
        trashWarning?.focus();
    }, []);

    const focusOnElementByID = (elementID?: string) => {
        if (!elementID) {
            return;
        }
        const index = elementIDs.findIndex((id) => id === elementID);
        setFocusIndex(index);
    };

    useEffect(() => {
        if (labelIDRef.current !== labelID) {
            resetFocusIndex();
            labelIDRef.current = labelID;
            return;
        }

        if (isComposerOpened || !elementIDs.length) {
            return;
        }

        // Keep focus on the same element if new messages are coming in
        if (focusedIDRef.current && elementIDs.includes(focusedIDRef.current)) {
            setTimeout(() => {
                if (isMounted()) {
                    focusOnElementByID(focusedIDRef.current);
                }
            });
            return;
        }

        // Keep focus position when updating the list (moving/deleting items)
        if (focusedIDRef.current && typeof focusIndex !== 'undefined') {
            if (elementIDs[focusIndex]) {
                setTimeout(() => focusOnElementByIndex(focusIndex));
                return;
            }

            setTimeout(() => focusOnElementByIndex(elementIDs.length - 1));
        }
    }, [labelID, elementIDs]);

    // Show flag change: focus on current index if defined fallback on first
    useEffect(() => {
        if (showList) {
            if (focusIndex !== undefined) {
                focusOnElementByIndex(focusIndex);
            } else if (elementIDs.length) {
                setFocusIndex(0);
            }
        }
    }, [showList]);

    // When page, filter, or sort changes, focus on the first element
    useEffect(() => {
        if (showList && elementIDs.length) {
            resetFocusIndex();
        }
    }, [page, filter, sort]);

    useEffect(() => {
        if (typeof focusIndex === 'undefined') {
            focusedIDRef.current = undefined;
        } else {
            focusOnElementByIndex(focusIndex);
            focusedIDRef.current = getFocusedId();
        }
    }, [focusIndex]);

    return {
        focusIndex,
        getFocusedId,
        setFocusIndex,
        resetFocusIndex,
        handleFocus,
        focusOnLastMessage,
    };
};
