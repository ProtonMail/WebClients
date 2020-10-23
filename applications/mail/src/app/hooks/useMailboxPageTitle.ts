import { Location } from 'history';
import { useEffect } from 'react';
import {
    useLabels,
    useUser,
    useConversationCounts,
    useMessageCounts,
    useMailSettings,
    useFolders,
} from 'react-components';
import { toMap } from 'proton-shared/lib/helpers/object';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { getLabelName } from '../helpers/labels';
import { isConversationMode } from '../helpers/mailSettings';

export const useMailboxPageTitle = (labelID: string, location: Location) => {
    const [mailSettings] = useMailSettings();
    const [labels] = useLabels();
    const [folders] = useFolders();
    const [user] = useUser();
    const [conversationCounts] = useConversationCounts() as [LabelCount[], boolean, Error];
    const [messageCounts] = useMessageCounts() as [LabelCount[], boolean, Error];

    useEffect(() => {
        const conversationMode = isConversationMode(labelID, mailSettings, location);
        const counters = conversationMode ? conversationCounts : messageCounts;
        const countersMap = toMap(counters, 'LabelID') as { [labelID: string]: LabelCount };
        const unreads = (countersMap[labelID] || {}).Unread || 0;
        const unreadString = unreads > 0 ? `(${unreads}) ` : '';
        const labelName = getLabelName(labelID, labels, folders);
        const address = user.Email;
        document.title = `${unreadString}${labelName} | ${address} | ProtonMail`;
    }, [labelID, mailSettings, user, labels, folders, conversationCounts, messageCounts]);
};
