import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { useDynamicFavicon } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';
import { useMessageCounts } from '@proton/mail/counts/messageCounts';

import useMailModel from 'proton-mail/hooks/useMailModel';

import favicons, { baseFavicon } from '../../../assets/favicons';
import { getCountersByLabelId } from '../../helpers/counter';
import { isConversationMode } from '../../helpers/mailSettings';

export const useMailboxFavicon = (labelID: string) => {
    const location = useLocation();

    const mailSettings = useMailModel('MailSettings');
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const conversationMode = isConversationMode(labelID, mailSettings, location);
    const counters = conversationMode ? conversationCounts : messageCounts;

    const countersByLabelId = useMemo(() => getCountersByLabelId(counters), [counters]);
    const unreads = countersByLabelId[labelID]?.Unread ?? 0;

    const shouldDisplayUnreadFavicon =
        useFeature(FeatureCode.UnreadFavicon).feature?.Value && mailSettings.UnreadFavicon;

    const unreadFavicon = !unreads ? baseFavicon : unreads > 99 ? favicons[100] : favicons[unreads];
    const faviconSrc = !shouldDisplayUnreadFavicon ? baseFavicon : unreadFavicon;
    useDynamicFavicon(faviconSrc);
};
