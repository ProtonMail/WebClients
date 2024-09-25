import { useEffect } from 'react';

import { useMessageCounts } from '@proton/components/hooks';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

const useInboxDesktopBadgeCount = () => {
    const [mailSettings] = useMailSettings();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const counts = mailSettings?.ViewMode === VIEW_MODE.GROUP ? conversationCounts : messageCounts;

    // Updates the notification badge on the desktop app icon depending on the unread count
    useEffect(() => {
        if (!isElectronMail) {
            return;
        }

        const inboxConvCount = counts?.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
        let payload = inboxConvCount?.Unread;

        if (payload === undefined) {
            captureMessage('Invalid undefined unread count', {
                level: 'error',
                extra: { inboxConvCount, payload },
            });

            payload = 0;
        } else if (payload < 0) {
            captureMessage('Invalid negative unread count', {
                level: 'error',
                extra: { inboxConvCount, payload },
            });

            payload = 0;
        }

        invokeInboxDesktopIPC({
            type: 'updateNotification',
            payload,
        });
    }, [counts]);
};

export default useInboxDesktopBadgeCount;
