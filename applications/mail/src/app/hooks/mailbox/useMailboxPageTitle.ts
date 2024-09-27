import { useEffect } from 'react';

import type { Location } from 'history';

import { useFolders, useLabels, useMessageCounts, useUser } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { getCountersByLabelId } from '../../helpers/counter';
import { getLabelName } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';

export const useMailboxPageTitle = (labelID: string, location: Location) => {
    const mailSettings = useMailModel('MailSettings');
    const [labels] = useLabels();
    const [folders] = useFolders();
    const [user] = useUser();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const shouldDisplayUnreadsInPageTitle = !(
        useFeature(FeatureCode.UnreadFavicon).feature?.Value && mailSettings.UnreadFavicon
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
