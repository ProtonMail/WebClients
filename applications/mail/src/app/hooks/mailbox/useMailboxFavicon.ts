import { Location } from 'history';

import { FeatureCode } from '@proton/components/containers';
import { useConversationCounts, useDynamicFavicon, useFeature, useMessageCounts } from '@proton/components/hooks';

import useMailModel from 'proton-mail/hooks/useMailModel';

import favicons, { baseFavicon } from '../../../assets/favicons';
import { getCountersByLabelId } from '../../helpers/counter';
import { isConversationMode } from '../../helpers/mailSettings';

export const useMailboxFavicon = (labelID: string, location: Location) => {
    const mailSettings = useMailModel('MailSettings');
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const conversationMode = isConversationMode(labelID, mailSettings, location);
    const counters = conversationMode ? conversationCounts : messageCounts;

    const countersByLabelId = getCountersByLabelId(counters);
    const unreads = countersByLabelId[labelID]?.Unread ?? 0;

    const shouldDisplayUnreadFavicon =
        useFeature(FeatureCode.UnreadFavicon).feature?.Value && mailSettings.UnreadFavicon;

    const unreadFavicon = !unreads ? baseFavicon : unreads > 99 ? favicons[100] : favicons[unreads];
    const faviconSrc = !shouldDisplayUnreadFavicon ? baseFavicon : unreadFavicon;
    useDynamicFavicon(faviconSrc);
};
