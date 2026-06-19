import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';

const getFallbackErrorMessage = () => c('BOSS').t`An unknown error ocurred. Please refresh the page and try again`;

export const useErrorHandler = () => {
    const { createNotification } = useNotifications();

    return (err: any) => {
        const text: string | undefined = err?.message ?? getFallbackErrorMessage();

        if (err?.status === HTTP_ERROR_CODES.UNLOCK) {
            return;
        }

        if (text?.length) {
            createNotification({
                type: 'error',
                text,
            });
        }
    };
};
