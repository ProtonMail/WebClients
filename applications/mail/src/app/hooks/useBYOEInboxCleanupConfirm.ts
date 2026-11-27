import { useCallback, useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useEventManager from '@proton/components/hooks/useEventManager';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import type {
    BYOEInboxCleanupChoice,
    BYOEInboxCleanupOutcome,
} from '../components/view/NewsletterSubscription/interface';
import type { BYOEInboxCleanupProgress } from '../helpers/byoeInboxCleanup';
import { cleanUpBYOEInboxSenders } from '../helpers/byoeInboxCleanup';

/**
 * Returns the `onConfirm` for one BYOE inbox cleanup window, so call it once per window.
 * It remembers what it has already done for each sender for as long as the window is mounted, so pressing
 * "Unsubscribe" again only redoes what failed. It shows an error when some senders aren't done, and resolves with
 * every sender unsubscribed in this window so far, so the window can show them once it closes.
 */
const useBYOEInboxCleanupConfirm = () => {
    const api = useApi();
    const [user] = useUser();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const hasPaidMail = user.hasPaidMail;
    const progressRef = useRef<BYOEInboxCleanupProgress>(new Map());
    const seenSubscriptionsRef = useRef(new Map<string, NewsletterSubscription>());

    const onConfirm = useCallback(
        async ({ subscriptions, archive }: BYOEInboxCleanupChoice): Promise<BYOEInboxCleanupOutcome> => {
            subscriptions.forEach((subscription) => {
                seenSubscriptionsRef.current.set(subscription.ID, subscription);
            });

            const allDone = await cleanUpBYOEInboxSenders({
                api,
                subscriptions,
                archive,
                applyToFuture: hasPaidMail,
                progress: progressRef.current,
            });
            void call();

            if (!allDone) {
                createNotification({
                    text: c('Error').t`Some mailing lists couldn't be unsubscribed. Try again to finish unsubscribing.`,
                    type: 'error',
                });
            }

            const unsubscribed = [...seenSubscriptionsRef.current.values()].filter(({ ID }) => {
                return progressRef.current.get(ID)?.unsubscribed;
            });

            return { allDone, unsubscribed };
        },
        [api, hasPaidMail, createNotification, call]
    );

    return onConfirm;
};

export default useBYOEInboxCleanupConfirm;
