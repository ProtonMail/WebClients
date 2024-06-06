import { useEffect } from 'react';

import { useConversationCounts, useMailSettings, useMessageCounts } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
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

        invokeInboxDesktopIPC({
            type: 'updateNotification',
            payload: inboxConvCount?.Unread ?? 0,
        });
    }, [counts]);
};

export default useInboxDesktopBadgeCount;
