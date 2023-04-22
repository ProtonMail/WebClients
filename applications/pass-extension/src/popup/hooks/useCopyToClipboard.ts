import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { logger } from '@proton/pass/utils/logger';

export const useCopyToClipboard = () => {
    const { createNotification } = useNotifications();

    return async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            createNotification({ type: 'success', text: c('Info').t`Copied to clipboard`, showCloseButton: false });
        } catch (err) {
            createNotification({ type: 'error', text: c('Info').t`Unable to copy to clipboard` });
            logger.error(`[Popup] unable to copy to clipboard`);
        }
    };
};
