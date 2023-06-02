import { useEffect } from 'react';

import { Location } from 'history';

import {
    FeatureCode,
    useConversationCounts,
    useFeature,
    useFolders,
    useLabels,
    useMailSettings,
    useMessageCounts,
    useUser,
} from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { getCountersByLabelId } from '../../helpers/counter';
import { getLabelName } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';

export const useMailboxPageTitle = (labelID: string, location: Location) => {
    const [mailSettings] = useMailSettings();
    const [labels] = useLabels();
    const [folders] = useFolders();
    const [user] = useUser();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const shouldDisplayUnreadsInPageTitle = !(
        useFeature(FeatureCode.UnreadFavicon).feature?.Value && mailSettings?.UnreadFavicon
    );

    useEffect(() => {
        const conversationMode = isConversationMode(labelID, mailSettings, location);
        const counters = conversationMode ? conversationCounts : messageCounts;
        const countersByLabelId = getCountersByLabelId(counters);

        const unreads = countersByLabelId[labelID]?.Unread ?? 0;
        const unreadString = unreads > 0 ? `(${unreads}) ` : '';

        const labelName = getLabelName(labelID, labels, folders);
        const mainTitle = `${labelName} | ${user.Email} | ${MAIL_APP_NAME}`;

        document.title = shouldDisplayUnreadsInPageTitle ? `${unreadString}${mainTitle}` : mainTitle;
    }, [
        labelID,
        mailSettings,
        user,
        labels,
        folders,
        conversationCounts,
        messageCounts,
        shouldDisplayUnreadsInPageTitle,
    ]);
};
