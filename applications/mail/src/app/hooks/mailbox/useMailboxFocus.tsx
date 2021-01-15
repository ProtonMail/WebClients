import { useEffect, useState } from 'react';
import { useHandler } from 'react-components';

export interface MailboxFocusContext {
    elementIDs: string[];
    columnLayout: boolean;
    showList: boolean;
    showContentView: boolean;
    showContentPanel: boolean;
}

export const useMailboxFocus = ({
    elementIDs,
    columnLayout,
    showList,
    showContentView,
    showContentPanel,
}: MailboxFocusContext) => {
    const [focusIndex, setFocusIndex] = useState<number>();

    const getFocusedId = () => (focusIndex !== undefined ? elementIDs[focusIndex] : undefined);

    const handleFocus = useHandler((index) => setFocusIndex(index));

    const focusOnElement = (index: number) => {
        const element = document.querySelector(
            `[data-shortcut-target="item-container"][data-element-id="${elementIDs[index]}"]`
        ) as HTMLElement;
        element?.focus();
    };

    const focusOnFirstListItem = () => {
        setFocusIndex(0);
        focusOnElement(0);
    };

    const focusOnLastMessage = () => {
        const messages = document.querySelectorAll('[data-shortcut-target="message-container"]');
        if (messages.length) {
            const lastMessage = messages[messages.length - 1] as HTMLElement;
            lastMessage.focus();
            setFocusIndex(undefined);
        }
    };

    useEffect(() => {
        if (focusIndex !== undefined) {
            focusOnElement(focusIndex);
        }
    }, [focusIndex]);

    useEffect(() => {
        focusOnFirstListItem();
    }, [elementIDs]);

    useEffect(() => {
        if (showList) {
            focusOnFirstListItem();
        }
        if (showContentView) {
            focusOnLastMessage();
        }
    }, [columnLayout, showContentPanel]);

    return { focusIndex, getFocusedId, setFocusIndex, handleFocus, focusOnLastMessage };
};
