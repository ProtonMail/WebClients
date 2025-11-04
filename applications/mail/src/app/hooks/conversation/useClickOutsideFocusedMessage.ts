import { useEffect } from 'react';

const useClickOutsideFocusedMessage = (
    focusedMessageId: string | undefined,
    onClickOutside: (event: MouseEvent) => void
) => {
    useEffect(() => {
        if (focusedMessageId === undefined) {
            return;
        }

        const clickCallback = (event: MouseEvent) => {
            try {
                if (!event.composed) {
                    return false;
                }

                const clickedInside = event
                    .composedPath()
                    .some(
                        (element) =>
                            element instanceof HTMLElement &&
                            'message-container' === element.dataset.shortcutTarget &&
                            focusedMessageId === element.dataset.messageId
                    );

                if (!clickedInside) {
                    onClickOutside(event);
                }
            } catch (e) {}
        };

        document.addEventListener('click', clickCallback);

        return () => {
            document.removeEventListener('click', clickCallback);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-C13476
    }, [focusedMessageId]);
};

export default useClickOutsideFocusedMessage;
