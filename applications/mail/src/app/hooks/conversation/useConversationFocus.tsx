import { FocusEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import useClickOutsideFocusedMessage from './useClickOutsideFocusedMessage';

export type HandleConversationFocus = (
    index: number | undefined,
    options?: { scrollTo?: boolean; withKeyboard?: boolean }
) => void;

export const useConversationFocus = (messages: Message[]) => {
    const [focusIndex, setFocusIndex] = useState<number>();
    const prevFocusIndexRef = useRef<number>();
    const [nextScrollTo, setNextScrollTo] = useState(false);
    // If last focust actions has been done with keyboard shortcut
    const withKeyboardRef = useRef(false);

    useClickOutsideFocusedMessage(focusIndex ? messages[focusIndex]?.ID : undefined, () => {
        setFocusIndex(undefined);
    });

    const getFocusedId = useCallback(
        () => (focusIndex !== undefined ? messages[focusIndex] : undefined)?.ID,
        [focusIndex, messages]
    );

    const handleFocus = useCallback<HandleConversationFocus>(
        (index, options) => {
            const { scrollTo = false, withKeyboard = false } = options || {};
            if (withKeyboard) {
                withKeyboardRef.current = true;
            }
            setFocusIndex(index);
            if (index === focusIndex) {
                setNextScrollTo(scrollTo);
            }
        },
        [focusIndex]
    );

    const handleBlur = useCallback(
        (event: FocusEvent<HTMLElement>, messageRef: RefObject<HTMLElement>) => {
            // Check if relatedTarget is inside message ref. If not remove focus
            // WARNING : relatedTarget returns null when clicking on iframe
            if (event.relatedTarget && !messageRef.current?.contains(event.relatedTarget)) {
                setFocusIndex(undefined);
                prevFocusIndexRef.current = undefined;
            }
        },
        [focusIndex]
    );

    useEffect(() => {
        if (focusIndex === undefined) {
            return;
        }

        const focus = (element: HTMLElement | null) => element?.focus({ preventScroll: true });

        let element = document.querySelector(
            `[data-shortcut-target="message-container"][data-message-id="${messages[focusIndex]?.ID}"]`
        ) as HTMLElement | null;

        if (element) {
            // If has been focused by keyboard shortcut
            if (withKeyboardRef.current === true) {
                focus(element);
            } else {
                focus(element.querySelector('iframe'));
            }
        }

        if (nextScrollTo) {
            element?.scrollIntoView({ behavior: 'smooth' });
            setNextScrollTo(false);
        }

        prevFocusIndexRef.current = focusIndex;
        withKeyboardRef.current = false;
    }, [focusIndex]);

    return { focusIndex, handleFocus, handleBlur, getFocusedId };
};
