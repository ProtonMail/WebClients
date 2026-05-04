import { useEffect } from 'react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { useMailboxCounter } from './mailboxCounter/useMailboxCounter';

const useInboxBadgeCount = () => {
    const { getLocationCount } = useMailboxCounter();
    const inboxConvCount = getLocationCount(MAILBOX_LABEL_IDS.INBOX);

    // Updates the notification badge on the desktop app icon depending on the unread count
    useEffect(() => {
        let payload = inboxConvCount.Unread;

        // This is expected for the first render,
        // until the inbox has been loaded
        if (payload === undefined) {
            payload = 0;
        } else if (payload < 0) {
            captureMessage('Invalid negative unread count', {
                level: 'error',
                extra: { inboxConvCount, payload },
            });

            payload = 0;
        }

        if (isElectronMail) {
            // Inbox Desktop app badge
            void invokeInboxDesktopIPC({
                type: 'updateNotification',
                payload,
            });
        } else if ('setAppBadge' in navigator) {
            // PWA badge
            navigator.setAppBadge(payload).catch(noop);
        }
    }, [inboxConvCount]);
};

export default useInboxBadgeCount;
