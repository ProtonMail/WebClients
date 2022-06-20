import { useEffect, useState } from 'react';

export const useQuickReplyFocus = () => {
    const [hasFocus, setHasFocus] = useState(false);

    useEffect(() => {
        const clickCallback = (event: MouseEvent) => {
            try {
                if (!event.composed) {
                    return false;
                }

                const clickedInside = event
                    .composedPath()
                    .some(
                        (element) =>
                            element instanceof HTMLElement && 'quick-reply-container' === element.dataset.shortcutTarget
                    );

                if (!clickedInside) {
                    setHasFocus(false);
                }
            } catch (e) {}
        };

        document.addEventListener('click', clickCallback);

        return () => {
            document.removeEventListener('click', clickCallback);
        };
    }, []);

    return { hasFocus, setHasFocus };
};
