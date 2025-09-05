import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';

export const useCopyTextToClipboard = () => {
    const { createNotification } = useNotifications();

    return async (value: string) => {
        await navigator.clipboard.writeText(value);
        createNotification({ type: 'info', text: c('Info').t`Copied to clipboard`, showCloseButton: false });
    };
};
