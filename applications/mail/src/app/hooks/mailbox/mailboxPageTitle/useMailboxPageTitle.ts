import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { useMailboxCounter } from 'proton-mail/hooks/mailboxCounter/useMailboxCounter';
import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { getLabelName } from '../../../helpers/labels';

export const useMailboxPageTitle = () => {
    const labelID = useMailSelector(selectLabelID);
    const [mailSettings] = useMailSettings();
    const [labels] = useLabels();
    const [folders] = useFolders();
    const [user] = useUser();

    const { getCurrentLocationCount, getLocationCount } = useMailboxCounter();
    const unreadFavicon = mailSettings.UnreadFavicon;
    // We want to ensure we show the primary category count for the inbox when categories enabled.
    // The `getLocationCount` takes care of this logic
    const unreadEmails =
        labelID === MAILBOX_LABEL_IDS.INBOX
            ? getLocationCount(MAILBOX_LABEL_IDS.INBOX).Unread
            : getCurrentLocationCount().Unread;

    useEffect(() => {
        const unreadString = !unreadFavicon && unreadEmails > 0 ? `(${unreadEmails}) ` : '';
        const labelName = getLabelName(labelID, labels, folders);
        document.title = `${unreadString}${labelName} | ${user.Email} | ${MAIL_APP_NAME}`;
    }, [unreadEmails, labelID, unreadFavicon, user.Email, labels, folders]);
};
