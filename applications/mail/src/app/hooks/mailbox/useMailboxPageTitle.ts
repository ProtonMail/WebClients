import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useUser } from '@proton/account/user/hooks';
import { useConversationCounts, useFolders, useLabels, useMessageCounts } from '@proton/mail';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { getCountersByLabelId } from '../../helpers/counter';
import { getLabelName } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';

export const useMailboxPageTitle = (labelID: string) => {
    const location = useLocation();

    const [mailSettings = DEFAULT_MAILSETTINGS] = useMailSettings();
    const [labels] = useLabels();
    const [folders] = useFolders();
    const [user] = useUser();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    useEffect(() => {
        const conversationMode = isConversationMode(labelID, mailSettings, location);
        const counters = conversationMode ? conversationCounts : messageCounts;
        const countersByLabelId = getCountersByLabelId(counters);

        const unreadEmails = countersByLabelId[labelID]?.Unread ?? 0;
        const unreadString = unreadEmails > 0 ? `(${unreadEmails}) ` : '';

        const labelName = getLabelName(labelID, labels, folders);
        const mainTitle = `${labelName} | ${user.Email} | ${MAIL_APP_NAME}`;

        // We show the unread count in the title if not present in the favicon
        document.title = mailSettings.UnreadFavicon ? mainTitle : `${unreadString}${mainTitle}`;
    }, [labelID, mailSettings, user.Email, labels, folders, conversationCounts, messageCounts]);
};
