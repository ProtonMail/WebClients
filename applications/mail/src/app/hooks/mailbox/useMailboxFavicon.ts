import { useDynamicFavicon } from '@proton/components/hooks/useDynamicFavicon';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import favicons, { baseFavicon } from '../../../assets/favicons';
import { useMailboxCounter } from '../mailboxCounter/useMailboxCounter';

export const useMailboxFavicon = () => {
    const [mailSettings] = useMailSettings();

    const { getCurrentLocationCount } = useMailboxCounter();
    const unreadEmails = getCurrentLocationCount().Unread;

    const unreadFavicon = !unreadEmails ? baseFavicon : unreadEmails > 99 ? favicons[100] : favicons[unreadEmails];
    const faviconSrc = mailSettings.UnreadFavicon ? unreadFavicon : baseFavicon;

    useDynamicFavicon(faviconSrc);
};
