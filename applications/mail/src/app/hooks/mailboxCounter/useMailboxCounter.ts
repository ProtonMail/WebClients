// We need the counters in this file because this is where we compute their values
import { useMemo } from 'react';

// eslint-disable-next-line no-restricted-imports
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
// eslint-disable-next-line no-restricted-imports
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useFolders, useLabels, useSystemFolders } from '@proton/mail/store/labels/hooks';
import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { SafeLabelCount } from '@proton/shared/lib/interfaces';

import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';
import { selectCategoryIDs, selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import type { LocationCountMap, MailboxCounterReturn } from './interface';
import { getCounterMap, getRawLocationCount } from './useMailboxCounter.helpers';

export const useMailboxCounter = (): MailboxCounterReturn => {
    const [mailSettings] = useMailSettings();

    const { categoryViewAccess } = useCategoriesView();

    const [labels, labelsLoading] = useLabels();
    const [folders, foldersLoading] = useFolders();
    const [systemFolders, systemFoldersLoading] = useSystemFolders();
    const [messageCounts, messageCountsLoading] = useMessageCounts();
    const [conversationCounts, conversationCountsLoading] = useConversationCounts();

    const disabledCategoryIDs = useMailSelector(selectDisabledCategoriesIDs);
    const currentLabelID = useMailSelector(selectLabelID);
    const categoryIDs = useMailSelector(selectCategoryIDs);

    const loading =
        labelsLoading || foldersLoading || systemFoldersLoading || conversationCountsLoading || messageCountsLoading;
    const hasAllData = mailSettings && labels && folders && systemFolders && conversationCounts && messageCounts;

    const counterMap = useMemo<LocationCountMap>(() => {
        if (loading || !hasAllData) {
            return {};
        }
        return getCounterMap({
            labels: [...labels, ...folders, ...systemFolders],
            conversationCounts,
            messageCounts,
            mailSettings,
            disabledCategoryIDs,
        });
    }, [
        loading,
        hasAllData,
        labels,
        folders,
        systemFolders,
        conversationCounts,
        messageCounts,
        mailSettings,
        disabledCategoryIDs,
    ]);

    const getLocationCount = (labelID: string): SafeLabelCount => {
        if (labelID === MAILBOX_LABEL_IDS.INBOX && categoryViewAccess) {
            return getRawLocationCount(counterMap, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
        }
        return getRawLocationCount(counterMap, labelID);
    };

    const getCurrentLocationCount = (): SafeLabelCount => {
        if (currentLabelID === MAILBOX_LABEL_IDS.INBOX && categoryViewAccess && categoryIDs.length > 0) {
            return getRawLocationCount(counterMap, categoryIDs[0]);
        }
        return getLocationCount(currentLabelID);
    };

    return {
        loading,
        counterMap,
        getLocationCount,
        getCurrentLocationCount,
    };
};
