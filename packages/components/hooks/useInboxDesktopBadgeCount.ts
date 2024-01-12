import { useEffect } from 'react';

import { useConversationCounts, useMailSettings } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { ProtonDesktopAPI } from '@proton/shared/lib/desktop/desktopType';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { UNREAD_FAVICON } from '@proton/shared/lib/mail/mailSettings';

declare const window: {
    protonDesktopAPI?: ProtonDesktopAPI;
};

const useInboxDesktopBadgeCount = () => {
    const isDesktop = isElectronApp();
    const [conversationCounts] = useConversationCounts();
    const [settings] = useMailSettings();

    // Updates the notification badge on the desktop app icon depending on the unread count
    // Respect user settings for the unread favicon
    useEffect(() => {
        if (!isDesktop || !window.protonDesktopAPI) {
            return;
        }

        if (settings?.UnreadFavicon === UNREAD_FAVICON.DISABLED) {
            window.protonDesktopAPI.updateNotification(0);
            return;
        }

        const inboxConvCount = conversationCounts?.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
        if (inboxConvCount && settings?.UnreadFavicon === UNREAD_FAVICON.ENABLED) {
            window.protonDesktopAPI.updateNotification(inboxConvCount.Unread ?? 0);
        }
    }, [conversationCounts, settings]);
};

export default useInboxDesktopBadgeCount;
