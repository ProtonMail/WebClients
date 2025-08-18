import type { FocusEvent, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import useClickOutsideFocusedMessage from './useClickOutsideFocusedMessage';

export type HandleConversationFocus = (
    index: number | undefined,
    options?: { scrollTo?: boolean; withKeyboard?: boolean }
) => void;

export const useConversationFocus = (messages: Message[]) => {
    const [focusIndex, setFocusIndex] = useState<number>();
    const [nextScrollTo, setNextScrollTo] = useState(false);
    // We might want to expand or scroll to a message without focusing it
    const preventFocusRef = useRef(false);
    // Controls the scrollIntoView alignment (center, start, end, nearest)
    const alignmentRef = useRef<ScrollLogicalPosition>('center');
    // If last focus actions has been done with keyboard shortcut
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

    const handleScrollToMessage = useCallback((index?: number, alignment?: ScrollLogicalPosition) => {
        preventFocusRef.current = true;
        if (alignment) {
            alignmentRef.current = alignment;
        }
        setFocusIndex(index);
        setNextScrollTo(true);
    }, []);

    const handleBlur = useCallback(
        (event: FocusEvent<HTMLElement>, messageRef: RefObject<HTMLElement>) => {
            // Check if relatedTarget is inside message ref. If not remove focus
            // WARNING : relatedTarget returns null when clicking on iframe
            if (event.relatedTarget && !messageRef.current?.contains(event.relatedTarget)) {
                setFocusIndex(undefined);
            }
        },
        [focusIndex]
    );

    useEffect(() => {
        if (focusIndex === undefined) {
            return;
        }

        const focus = (element: HTMLElement | null) => element?.focus({ preventScroll: true });

        const element = document.querySelector(
            `[data-shortcut-target="message-container"][data-message-id="${messages[focusIndex]?.ID}"]`
        ) as HTMLElement | null;

        if (element && !preventFocusRef.current) {
            const iframe = element.querySelector('iframe');

            // If has been focused by keyboard shortcut
            // Also, if opening the message for the first time, the iframe will not be defined yet
            // In that case, we want to focus the message, otherwise, nothing gets the focus
            if (withKeyboardRef.current === true || !iframe) {
                focus(element);
            } else {
                focus(iframe);
            }
        }

        withKeyboardRef.current = false;
        preventFocusRef.current = false;
    }, [focusIndex]);

    useEffect(() => {
        if (focusIndex !== undefined && nextScrollTo) {
            const element = document.querySelector(
                `[data-shortcut-target="message-container"][data-message-id="${messages[focusIndex]?.ID}"]`
            ) as HTMLElement | null;
            element?.scrollIntoView({ block: alignmentRef.current, behavior: 'smooth' });
            alignmentRef.current = 'center';
            setNextScrollTo(false);
        }
    }, [nextScrollTo]);

    return { focusIndex, handleFocus, handleScrollToMessage, handleBlur, getFocusedId };
};
