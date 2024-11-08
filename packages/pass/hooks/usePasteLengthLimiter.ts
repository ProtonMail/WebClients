import type { ClipboardEventHandler } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

export const usePasteLengthLimiter = () => {
    const { createNotification } = useNotifications();

    return (
            maxLength: number,
            originalOnPaste?: ClipboardEventHandler<HTMLInputElement | HTMLTextAreaElement>
        ): ClipboardEventHandler<HTMLInputElement | HTMLTextAreaElement> =>
        (event) => {
            const text = event.clipboardData?.getData('text') ?? '';
            const { value, selectionStart, selectionEnd } = event.currentTarget;
            const base = value.length - ((selectionEnd ?? 0) - (selectionStart ?? 0));

            if (base + text.length > maxLength) {
                createNotification({
                    key: 'max-length-limiter',
                    type: 'warning',
                    deduplicate: true,
                    text: c('Info')
                        .t`The text you're trying to paste is longer than the maximum allowed length of ${maxLength} characters.`,
                });
            }

            originalOnPaste?.(event);
        };
};
