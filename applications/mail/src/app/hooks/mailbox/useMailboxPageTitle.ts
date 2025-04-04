import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useUser } from '@proton/account/user/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import { useFolders, useLabels } from '@proton/mail';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';
import { useMessageCounts } from '@proton/mail/counts/messageCounts';
import { getLabelName } from '@proton/mail/labels/helpers';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { getCountersByLabelId } from '../../helpers/counter';
import { isConversationMode } from '../../helpers/mailSettings';

export const useMailboxPageTitle = (labelID: string) => {
    const location = useLocation();

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
