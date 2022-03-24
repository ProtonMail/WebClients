import { FocusEvent, RefObject, useCallback, useEffect, useState } from 'react';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

export const useConversationFocus = (messages: Message[]) => {
    const [focusIndex, setFocusIndex] = useState<number>();
    const [nextScrollTo, setNextScrollTo] = useState(false);

    const getFocusedId = useCallback(
        () => (focusIndex !== undefined ? messages[focusIndex] : undefined)?.ID,
        [focusIndex, messages]
    );

    const handleFocus = useCallback(
        (index: number | undefined, scrollTo = false) => {
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
            }
        },
        [focusIndex]
    );

    useEffect(() => {
        if (focusIndex === undefined) {
            return;
        }
        const element = document.querySelector(
            `[data-shortcut-target="message-container"][data-message-id="${messages[focusIndex]?.ID}"]`
        ) as HTMLElement;
        element?.focus({ preventScroll: true });
        if (nextScrollTo) {
            element?.scrollIntoView({ behavior: 'smooth' });
            setNextScrollTo(false);
        }
    }, [focusIndex]);

    return { focusIndex, handleFocus, handleBlur, getFocusedId };
};
