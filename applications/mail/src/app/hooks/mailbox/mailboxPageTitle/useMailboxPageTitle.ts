import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

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

    const { getCurrentLocationCount } = useMailboxCounter();

    useEffect(() => {
        const unreadEmails = getCurrentLocationCount().Unread;
        const unreadString = unreadEmails > 0 ? `(${unreadEmails}) ` : '';

        const labelName = getLabelName(labelID, labels, folders);
        const mainTitle = `${labelName} | ${user.Email} | ${MAIL_APP_NAME}`;

        // We show the unread count in the title if not present in the favicon
        document.title = mailSettings.UnreadFavicon ? mainTitle : `${unreadString}${mainTitle}`;
    }, [getCurrentLocationCount, labelID, mailSettings, user.Email, labels, folders]);
};
