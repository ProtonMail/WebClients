import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { logger } from '@proton/pass/utils/logger';

export const useCopyToClipboard = () => {
    const { createNotification } = useNotifications();
    const { writeToClipboard } = usePassCore();

    return async (value: string) => {
        try {
            await writeToClipboard(value);
            createNotification({ type: 'success', text: c('Info').t`Copied to clipboard`, showCloseButton: false });
        } catch (err) {
            createNotification({ type: 'error', text: c('Info').t`Unable to copy to clipboard` });
            logger.error(`[Popup] unable to copy to clipboard`, err);
        }
    };
};
