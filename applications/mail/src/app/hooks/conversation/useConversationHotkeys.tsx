import { useRef } from 'react';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { HotkeyTuple, useHotkeys } from 'react-components';

export interface ConversationHotkeysContext {
    messages: Message[];
    focusIndex: number | undefined;
}

export interface ConversationHotkeysHandlers {
    handleFocus: (index: number | undefined) => void;
    expandMessage: (ID: string) => void;
    getFocusedId: () => string | undefined;
}

export const useConversationHotkeys = (
    { messages, focusIndex }: ConversationHotkeysContext,
    { handleFocus, expandMessage, getFocusedId }: ConversationHotkeysHandlers
) => {
    const elementRef = useRef(null);
    const shortcutHandlers: HotkeyTuple[] = [
        [
            'ArrowLeft',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                const element =
                    (document.querySelector(
                        '[data-shortcut-target="item-container"][data-shortcut-target-selected="true"]'
                    ) as HTMLElement) ||
                    (document.querySelector('[data-shortcut-target="item-container"]') as HTMLElement);
                element?.focus();
                handleFocus(undefined);
            },
        ],
        [
            ['Meta', 'ArrowUp'],
            (e) => {
                e.stopPropagation();
                handleFocus(0);
            },
        ],
        [
            'ArrowUp',

            (e) => {
                e.stopPropagation();
                const previousIndex = focusIndex !== undefined ? Math.max(0, focusIndex - 1) : messages.length - 1;
                // leave the browser arrow scroll for last email
                if (previousIndex !== 0) {
                    e.preventDefault();
                }
                handleFocus(previousIndex);
            },
        ],
        [
            ['Meta', 'ArrowDown'],

            (e) => {
                e.stopPropagation();
                handleFocus(messages.length - 1);
            },
        ],
        [
            'ArrowDown',

            (e) => {
                e.stopPropagation();
                const lastIndex = messages.length - 1;
                const nextIndex = focusIndex !== undefined ? Math.min(lastIndex, focusIndex + 1) : 0;
                // leave the browser arrow scroll for last email
                if (nextIndex !== lastIndex) {
                    e.preventDefault();
                }
                handleFocus(nextIndex);
            },
        ],
        [
            'Enter',
            (e) => {
                e.stopPropagation();
                const id = getFocusedId();
                if (id) {
                    expandMessage(id);
                }
            },
        ],
    ];

    useHotkeys(elementRef, shortcutHandlers);

    return { elementRef };
};
