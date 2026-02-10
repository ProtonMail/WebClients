import { createSelector } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';

export const selectConversationCounts = (state: any) => state.conversationCounts;

export const selectConversationCountsForLabel = createSelector(
    [selectConversationCounts, (_state: any, labelId: string) => labelId],
    (conversationCounts, labelId): LabelCount => {
        if (labelId == MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            // TODO reduce and add all disabled categories
        }

        const labelCount = conversationCounts.value?.find((count: LabelCount) => count.LabelID === labelId);
        return labelCount ? labelCount : { Total: 0, Unread: 0, LabelID: labelId };
    }
);
