import { useEffect } from 'react';

import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import noop from '@proton/utils/noop';

const useInboxBadgeCount = () => {
    const [mailSettings] = useMailSettings();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const counts = mailSettings.ViewMode === VIEW_MODE.GROUP ? conversationCounts : messageCounts;

    // Updates the notification badge on the desktop app icon depending on the unread count
    useEffect(() => {
        const inboxConvCount = counts?.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
        let payload = inboxConvCount?.Unread;

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
    }, [counts]);
};

export default useInboxBadgeCount;
