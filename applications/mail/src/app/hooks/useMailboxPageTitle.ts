import { Location } from 'history';
import { useEffect } from 'react';
import {
    useLabels,
    useUser,
    useConversationCounts,
    useMessageCounts,
    useMailSettings,
    useFolders
} from 'react-components';
import { getLabelName } from '../helpers/labels';
import { isConversationMode } from '../helpers/mailSettings';
import { toMap } from 'proton-shared/lib/helpers/object';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

export const useMailboxPageTitle = (labelID: string, location: Location) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [labels, loadingLabels] = useLabels();
    const [folders, loadingFolders] = useFolders();
    const [user, loadingUser] = useUser();
    const [conversationCounts, loadingConversationCounts] = useConversationCounts() as [LabelCount[], boolean, Error];
    const [messageCounts, loadingMessageCounts] = useMessageCounts() as [LabelCount[], boolean, Error];

    const loadings = [
        loadingMailSettings,
        loadingLabels,
        loadingFolders,
        loadingUser,
        loadingConversationCounts,
        loadingMessageCounts
    ];

    useEffect(() => {
        if (loadings.every((loading) => !loading)) {
            const conversationMode = isConversationMode(labelID, mailSettings, location);
            const counters = conversationMode ? conversationCounts : messageCounts;
            const countersMap = toMap(counters, 'LabelID') as { [labelID: string]: LabelCount };
            const unreads = (countersMap[labelID] || {}).Unread || 0;
            const unreadString = unreads > 0 ? `(${unreads}) ` : '';
            const labelName = getLabelName(labelID, labels, folders);
            const address = user.Email;
            document.title = `${unreadString}${labelName} | ${address} | ProtonMail`;
        }
    }, [labelID, conversationCounts, messageCounts, ...loadings]);
};
