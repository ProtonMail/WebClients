import { useEffect } from 'react';
import { useLabels, useUser, useConversationCounts, useMessageCounts, useMailSettings } from 'react-components';
import { getLabelName } from '../helpers/labels';
import { isConversationMode } from '../helpers/mailSettings';
import { toMap } from 'proton-shared/lib/helpers/object';
import { LabelCount } from '../models/label';

export const useMailboxPageTitle = (labelID: string) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [labels, loadingLabels] = useLabels();
    const [user, loadingUser] = useUser();
    const [conversationCounts, loadingConversationCounts] = useConversationCounts() as [LabelCount[], boolean];
    const [messageCounts, loadingMessageCounts] = useMessageCounts() as [LabelCount[], boolean];

    const loadings = [loadingMailSettings, loadingLabels, loadingUser, loadingConversationCounts, loadingMessageCounts];

    useEffect(() => {
        if (loadings.every((loading) => !loading)) {
            const conversationMode = isConversationMode(labelID, mailSettings);
            const counters = conversationMode ? conversationCounts : messageCounts;
            const countersMap = toMap(counters, 'LabelID') as { [labelID: string]: LabelCount };
            const unreads = (countersMap[labelID] || {}).Unread || 0;
            const unreadString = unreads > 0 ? `(${unreads}) ` : '';
            const labelName = getLabelName(labelID, labels);
            const address = user.Email;
            document.title = `${unreadString}${labelName} | ${address} | ProtonMail`;
        }
    }, [labelID, ...loadings]);
};
