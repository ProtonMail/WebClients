import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useFolders, useLabels, useSystemFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { selectCategoryIDs } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import type { MailboxCounterReturn } from './interface';
import { getCounterMap } from './useMailboxCounter.helpers';

export const useMailboxCounter = (): MailboxCounterReturn => {
    const [mailSettings] = useMailSettings();

    const [labels, labelsLoading] = useLabels();
    const [folders, foldersLoading] = useFolders();
    const [systemFolders, systemFoldersLoading] = useSystemFolders();

    const categoryIDs = useMailSelector(selectCategoryIDs);

    const [conversationCounts, conversationCountsLoading] = useConversationCounts();
    const [messageCounts, messageCountsLoading] = useMessageCounts();

    const loading =
        labelsLoading || foldersLoading || systemFoldersLoading || conversationCountsLoading || messageCountsLoading;

    if (loading || !mailSettings || !labels || !folders || !systemFolders || !conversationCounts || !messageCounts) {
        return {
            loading,
            counterMap: {},
        };
    }

    const allLocations = [...labels, ...folders, ...systemFolders];
    const counterMap = getCounterMap(allLocations, conversationCounts, messageCounts, mailSettings, categoryIDs);

    return {
        loading,
        counterMap,
    };
};
