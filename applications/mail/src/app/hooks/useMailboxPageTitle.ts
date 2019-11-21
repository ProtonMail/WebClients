import { useEffect } from 'react';
import { useLabels, useUser, useConversationCounts, useMessageCounts, useMailSettings } from 'react-components';
import { getLabelName } from '../helpers/labels';
import { isConversationMode } from '../helpers/mailSettings';
import { toMap } from 'proton-shared/lib/helpers/object';

export const useMailboxPageTitle = (labelID: string) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [labels, loadingLabels] = useLabels();
    const [user, loadingUser] = useUser();
    const [conversationCounts, loadingConversationCounts] = useConversationCounts();
    const [messageCounts, loadingMessageCounts] = useMessageCounts();

    const loadings = [loadingMailSettings, loadingLabels, loadingUser, loadingConversationCounts, loadingMessageCounts];

    useEffect(() => {
        if (loadings.every((loading) => !loading)) {
            const conversationMode = isConversationMode(mailSettings);
            const counters = conversationMode ? conversationCounts : messageCounts;
            const unreads = (toMap(counters, 'LabelID')[labelID] || {}).Unread;
            const unreadString = unreads > 0 ? `(${unreads}) ` : '';
            const labelName = getLabelName(labelID, labels);
            const address = user.Email;
            document.title = `${unreadString}${labelName} | ${address} | ProtonMail`;
        }
    }, [labelID, ...loadings]);
};
