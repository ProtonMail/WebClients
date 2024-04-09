import { useEffect } from 'react';

import { useConversationCounts } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { IPCInboxMessageBroker } from '@proton/shared/lib/desktop/desktopTypes';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

declare global {
    interface Window {
        ipcInboxMessageBroker?: IPCInboxMessageBroker;
    }
}

const useInboxDesktopBadgeCount = () => {
    const [conversationCounts] = useConversationCounts();

    // Updates the notification badge on the desktop app icon depending on the unread count
    useEffect(() => {
        if (!isElectronMail) {
            return;
        }

        const inboxConvCount = conversationCounts?.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
        if (inboxConvCount) {
            invokeInboxDesktopIPC({
                type: 'updateNotification',
                payload: inboxConvCount.Unread ?? 0,
            });
        }
    }, [conversationCounts]);
};

export default useInboxDesktopBadgeCount;
