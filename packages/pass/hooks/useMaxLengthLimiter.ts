import type { KeyboardEventHandler } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

export const useMaxLengthLimiter = () => {
    const { createNotification } = useNotifications();

    return (
            maxLength: number,
            originalOnKeyDown?: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>
        ): KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> =>
        (event) => {
            if (event.key.length === 1 && event.currentTarget.value.length >= maxLength) {
                createNotification({
                    key: 'max-length-limiter',
                    type: 'warning',
                    deduplicate: true,
                    text: c('Info').t`You have reached the maximum allowed length of ${maxLength} characters.`,
                });
            }
            originalOnKeyDown?.(event);
        };
};
