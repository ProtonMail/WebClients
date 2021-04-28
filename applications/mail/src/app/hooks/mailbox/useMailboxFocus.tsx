import { useEffect, useState, MutableRefObject, useRef } from 'react';
import { useHandler } from 'react-components';

export interface MailboxFocusContext {
    elementIDs: string[];
    showList: boolean;
    listRef: MutableRefObject<HTMLElement | null>;
    labelID: string;
}

export const useMailboxFocus = ({ elementIDs, showList, listRef, labelID }: MailboxFocusContext) => {
    const [focusIndex, setFocusIndex] = useState<number>();

    const getFocusedId = () => (focusIndex !== undefined ? elementIDs[focusIndex] : undefined);

    const labelIDRef = useRef(labelID);
    const focusedIDRef = useRef(getFocusedId());

    const handleFocus = useHandler((index) => setFocusIndex(index));

    const focusOnElementByIndex = (index: number) => {
        const element = listRef.current?.querySelector(
            `[data-shortcut-target="item-container"][data-element-id="${elementIDs[index]}"]`
        ) as HTMLElement;
        element?.focus();
    };

    const focusOnFirstListItem = () => {
        if (elementIDs.length) {
            setFocusIndex(0);
        }
    };

    const focusOnLastMessage = () => {
        const messages = document.querySelectorAll('[data-shortcut-target="message-container"]');
        if (messages.length) {
            const lastMessage = messages[messages.length - 1] as HTMLElement;
            lastMessage.focus();
            setFocusIndex(undefined);
            return;
        }
        const trashWarning = document.querySelector('[data-shortcut-target="trash-warning"]') as HTMLElement;
        trashWarning?.focus();
    };

    const focusOnElementByID = (elementID: string) => {
        const index = elementIDs.findIndex((id) => id === elementID);
        const element = listRef.current?.querySelector(
            `[data-shortcut-target="item-container"][data-element-id="${elementID}"]`
        ) as HTMLElement;
        element?.focus();
        setFocusIndex(index);
    };

    useEffect(() => {
        if (labelIDRef.current !== labelID) {
            setFocusIndex(undefined);
            focusedIDRef.current = undefined;
        }

        // keep focus on the same element if new messages are coming in
        if (labelIDRef.current === labelID && focusedIDRef.current && elementIDs.includes(focusedIDRef.current)) {
            focusOnElementByID(focusedIDRef.current);
        }

        labelIDRef.current = labelID;
    }, [labelID, elementIDs]);

    useEffect(() => {
        if (showList) {
            focusOnFirstListItem();
        }
    }, [showList]);

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
