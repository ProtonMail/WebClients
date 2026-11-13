import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useEventManager from '@proton/components/hooks/useEventManager';

import type { BYOEInboxCleanupChoice } from '../containers/globalModals/inteface';
import type { BYOEInboxCleanupProgress } from '../helpers/byoeInboxCleanup';
import { cleanUpBYOEInboxSenders } from '../helpers/byoeInboxCleanup';

const getConfirmationText = (count: number, archive: boolean) => {
    if (archive) {
        return c('Success').ngettext(
            msgid`Unsubscribed from ${count} mailing list and moved its messages to Archive.`,
            `Unsubscribed from ${count} mailing lists and moved their messages to Archive.`,
            count
        );
    }
    return c('Success').ngettext(
        msgid`Unsubscribed from ${count} mailing list.`,
        `Unsubscribed from ${count} mailing lists.`,
        count
    );
};

/**
 * Returns a function that creates the `onConfirm` for one BYOE inbox cleanup window.
 * Each `onConfirm` remembers what it has already done for each sender, so pressing "Unsubscribe" again
 * only redoes what failed. It keeps going, and shows its message, even after the window is closed.
 */
const useBYOEInboxCleanupConfirm = () => {
    const api = useApi();
    const [user] = useUser();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const hasPaidMail = user.hasPaidMail;

    const createBYOEInboxCleanupConfirm = useCallback(() => {
        const progress: BYOEInboxCleanupProgress = new Map();

        return async ({ subscriptions, archive }: BYOEInboxCleanupChoice) => {
            const allDone = await cleanUpBYOEInboxSenders({
                api,
                subscriptions,
                archive,
                applyToFuture: hasPaidMail,
                progress,
            });
            void call();

            if (!allDone) {
                createNotification({
                    text: c('Error').t`Some mailing lists couldn't be unsubscribed. Try again to finish unsubscribing.`,
                    type: 'error',
                });
                throw new Error('Some BYOE inbox cleanup senders could not be unsubscribed or archived');
            }

            createNotification({ text: getConfirmationText(subscriptions.length, archive) });
        };
    }, [api, hasPaidMail, createNotification, call]);

    return createBYOEInboxCleanupConfirm;
};

export default useBYOEInboxCleanupConfirm;
