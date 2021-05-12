import { useEffect, useState } from 'react';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';

export const useConversationFocus = (messages: Message[]) => {
    const [focusIndex, setFocusIndex] = useState<number>();

    const getFocusedMessage = () => (focusIndex !== undefined ? messages[focusIndex] : undefined);
    const getFocusedId = () => getFocusedMessage()?.ID;

    const handleFocus = (index: number | undefined) => {
        if (index === focusIndex) {
            return;
        }
        setFocusIndex(index);
    };

    useEffect(() => {
        if (focusIndex === undefined) {
            return;
        }
        const element = document.querySelector(
            `[data-shortcut-target="message-container"][data-message-id="${messages[focusIndex]?.ID}"]`
        ) as HTMLElement;
        element?.focus();
    }, [focusIndex]);

    return { focusIndex, handleFocus, getFocusedId };
};
