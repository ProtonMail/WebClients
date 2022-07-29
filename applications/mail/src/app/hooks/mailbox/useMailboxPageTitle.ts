import { useEffect } from 'react';

import { Location } from 'history';

import {
    useConversationCounts,
    useFolders,
    useLabels,
    useMailSettings,
    useMessageCounts,
    useUser,
} from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { LabelCount } from '@proton/shared/lib/interfaces';

import { getLabelName } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';

export const useMailboxPageTitle = (labelID: string, location: Location) => {
    const [mailSettings] = useMailSettings();
    const [labels] = useLabels();
    const [folders] = useFolders();
    const [user] = useUser();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    useEffect(() => {
        const conversationMode = isConversationMode(labelID, mailSettings, location);
        const counters = conversationMode ? conversationCounts : messageCounts;
        const countersMap = toMap(counters, 'LabelID') as { [labelID: string]: LabelCount };
        const unreads = (countersMap[labelID] || {}).Unread || 0;
        const unreadString = unreads > 0 ? `(${unreads}) ` : '';
        const labelName = getLabelName(labelID, labels, folders);
        const address = user.Email;
        document.title = `${unreadString}${labelName} | ${address} | ${MAIL_APP_NAME}`;
    }, [labelID, mailSettings, user, labels, folders, conversationCounts, messageCounts]);
};
