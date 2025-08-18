import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { useDynamicFavicon } from '@proton/components';
import { useConversationCounts, useMessageCounts } from '@proton/mail';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import favicons, { baseFavicon } from '../../../assets/favicons';
import { getCountersByLabelId } from '../../helpers/counter';
import { isConversationMode } from '../../helpers/mailSettings';

export const useMailboxFavicon = (labelID: string) => {
    const location = useLocation();

    const [mailSettings = DEFAULT_MAILSETTINGS] = useMailSettings();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const conversationMode = isConversationMode(labelID, mailSettings, location);
    const counters = conversationMode ? conversationCounts : messageCounts;

    const countersByLabelId = useMemo(() => getCountersByLabelId(counters), [counters]);
    const unreadEmails = countersByLabelId[labelID]?.Unread ?? 0;

    const unreadFavicon = !unreadEmails ? baseFavicon : unreadEmails > 99 ? favicons[100] : favicons[unreadEmails];
    const faviconSrc = mailSettings.UnreadFavicon ? unreadFavicon : baseFavicon;
    useDynamicFavicon(faviconSrc);
};
