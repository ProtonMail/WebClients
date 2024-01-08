import { useEffect } from 'react';

import { useConversationCounts } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { ProtonDesktopAPI } from '@proton/shared/lib/desktop/desktopType';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

declare const window: {
    protonDesktopAPI?: ProtonDesktopAPI;
};

const useDesktopAppIpc = () => {
    const isDesktop = isElectronApp();
    const [conversationCounts] = useConversationCounts();

    // Updates the notification badge on the desktop app icon depending on the unread count
    useEffect(() => {
        const inboxConvCount = conversationCounts?.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
        if (isDesktop && inboxConvCount && window.protonDesktopAPI) {
            window.protonDesktopAPI.updateNotification(inboxConvCount.Unread ?? 0);
        }
    }, [conversationCounts]);
};

export default useDesktopAppIpc;
