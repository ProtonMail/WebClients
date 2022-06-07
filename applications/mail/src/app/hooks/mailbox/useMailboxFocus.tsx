import { useEffect, useState, MutableRefObject, useRef, useCallback } from 'react';
import useIsMounted from '@proton/hooks/useIsMounted';

import { useHandler } from '@proton/components';

export interface MailboxFocusContext {
    elementIDs: string[];
    page: number;
    showList: boolean;
    listRef: MutableRefObject<HTMLElement | null>;
    labelID: string;
    isComposerOpened: boolean;
}

export const useMailboxFocus = ({
    elementIDs,
    page,
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

    const labelIDRef = useRef(labelID);
    const focusedIDRef = useRef(getFocusedId());

    const handleFocus = useHandler((index) => setFocusIndex(index));

    const focusOnElementByIndex = (index: number) => {
        // Selecting on index may fail during loading time with placeholders
        // Selecting by sibblings is a bit more stable but we have to skip "ListSettings"
        const element = listRef.current?.querySelector(
            `.item-container-wrapper:nth-child(${index + 1}) [data-shortcut-target="item-container"]`
        ) as HTMLElement;
        element?.focus();
    };

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
            setFocusIndex(undefined);
            focusedIDRef.current = undefined;
            labelIDRef.current = labelID;
            return;
        }

        if (isComposerOpened || !elementIDs.length) {
            return;
        }

        // keep focus on the same element if new messages are coming in
        if (focusedIDRef.current && elementIDs.includes(focusedIDRef.current)) {
            setTimeout(() => {
                if (isMounted()) {
                    focusOnElementByID(focusedIDRef.current);
                }
            });
            return;
        }

        // keep focus position when updating the list (moving/deleting items)
        if (typeof focusIndex !== 'undefined') {
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

    // Page change: focus on first element
    useEffect(() => {
        if (showList && elementIDs.length) {
            setFocusIndex(0);
        }
    }, [page]);

    useEffect(() => {
        if (typeof focusIndex !== 'undefined') {
            focusOnElementByIndex(focusIndex);
        }

        focusedIDRef.current = getFocusedId();
    }, [focusIndex]);

    return {
        focusIndex,
        getFocusedId,
        setFocusIndex,
        handleFocus,
        focusOnLastMessage,
    };
};
