import { useCallback, useEffect, useState } from 'react';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

export const useConversationFocus = (messages: Message[]) => {
    const [focusIndex, setFocusIndex] = useState<number>();

    const getFocusedId = useCallback(
        () => (focusIndex !== undefined ? messages[focusIndex] : undefined)?.ID,
        [focusIndex, messages]
    );

    const handleFocus = useCallback(
        (index: number | undefined) => {
            if (index === focusIndex) {
                return;
            }
            setFocusIndex(index);
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
    }, [focusIndex]);

    return { focusIndex, handleFocus, getFocusedId };
};
