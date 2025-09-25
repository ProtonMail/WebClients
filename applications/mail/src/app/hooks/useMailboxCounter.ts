import { useConversationCounts, useFolders, useLabels, useMessageCounts, useSystemFolders } from '@proton/mail';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { SafeLabelCount } from '@proton/shared/lib/interfaces';

import { getCounterMap } from './useMailboxCounter.helpers';

export type LocationCountMap = Record<string, SafeLabelCount>;

export const useMailboxCounter = (): [LocationCountMap, boolean] => {
    const [mailSettings] = useMailSettings();

    const [labels, labelsLoading] = useLabels();
    const [folders, foldersLoading] = useFolders();
    const [systemFolders, systemFoldersLoading] = useSystemFolders();

    const [conversationCounts, conversationCountsLoading] = useConversationCounts();
    const [messageCounts, messageCountsLoading] = useMessageCounts();

    const loading =
        labelsLoading || foldersLoading || systemFoldersLoading || conversationCountsLoading || messageCountsLoading;

    if (loading || !mailSettings || !labels || !folders || !systemFolders || !conversationCounts || !messageCounts) {
        return [{}, loading];
    }

    const allLocations = [...labels, ...folders, ...systemFolders];
    const counterMap = getCounterMap(allLocations, conversationCounts, messageCounts, mailSettings);
    return [counterMap, loading];
};
