import { createSelector } from '@reduxjs/toolkit';

import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { type ConversationCountsState, selectConversationCounts } from '../counts/conversationCountsSlice';
import { type MessageCountsState, selectMessageCounts } from '../counts/messageCountsSlice';
import type { CategoriesState } from '../labels';
import { selectDisabledCategoriesIDs } from '../labels/selector';
import { selectMailSettings } from '../mailSettings';

export type CategoriesViewState = ConversationCountsState & MessageCountsState & CategoriesState;

const categoryID = (_: CategoriesViewState, categoryID: CategoryLabelID) => categoryID;

const getUnreadForLabel = (counts: LabelCount[] | undefined, labelID: string): number => {
    return counts?.find((count) => count.LabelID === labelID)?.Unread || 0;
};

interface SelectCategoryUnreadCountResult {
    count: number;
    loading: boolean;
}

/**
 * Return the unread count of a category along with its loading state.
 *
 * Categories only: the conversation/message split is decided on ViewMode alone, which is
 * `isConversationMode` reduced to the category case. The clauses it drops (newsletter view,
 * always-message labels, active search) can never apply to a category ID, but they do apply
 * to other labels — do not widen this to arbitrary label IDs.
 */
export const selectCategoryUnreadCount = createSelector(
    [selectConversationCounts, selectMessageCounts, selectDisabledCategoriesIDs, selectMailSettings, categoryID],
    (
        conversationCounts,
        messageCounts,
        disabledCategoriesIDs,
        mailSettings,
        categoryID
    ): SelectCategoryUnreadCountResult => {
        const counter =
            mailSettings.value?.ViewMode === VIEW_MODE.GROUP ? conversationCounts.value : messageCounts.value;

        const loading = !counter;

        // The primary category contains the unread of every disabled category
        if (categoryID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT && disabledCategoriesIDs.length > 0) {
            return {
                count: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, ...disabledCategoriesIDs].reduce(
                    (total, id) => total + getUnreadForLabel(counter, id),
                    0
                ),
                loading,
            };
        }

        return {
            count: getUnreadForLabel(counter, categoryID),
            loading,
        };
    }
);
