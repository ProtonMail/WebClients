import { useEffect } from 'react';

import { useConversationCounts, useMailSettings } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { IPCInboxMessageBroker } from '@proton/shared/lib/desktop/desktopTypes';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { UNREAD_FAVICON } from '@proton/shared/lib/mail/mailSettings';

declare global {
    interface Window {
        ipcInboxMessageBroker?: IPCInboxMessageBroker;
    }
}

const useInboxDesktopBadgeCount = () => {
    const [conversationCounts] = useConversationCounts();
    const [settings] = useMailSettings();

    // Updates the notification badge on the desktop app icon depending on the unread count
    // Respect user settings for the unread favicon
    useEffect(() => {
        if (!isElectronApp || !window.ipcInboxMessageBroker) {
            return;
        }

        if (settings?.UnreadFavicon === UNREAD_FAVICON.DISABLED) {
            window.ipcInboxMessageBroker.send('updateNotification', 0);
            return;
        }

        const inboxConvCount = conversationCounts?.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
        if (inboxConvCount && settings?.UnreadFavicon === UNREAD_FAVICON.ENABLED) {
            window.ipcInboxMessageBroker.send('updateNotification', inboxConvCount.Unread ?? 0);
        }
    }, [conversationCounts, settings]);
};

export default useInboxDesktopBadgeCount;
