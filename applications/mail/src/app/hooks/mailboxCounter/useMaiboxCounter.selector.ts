import { createSelector } from '@reduxjs/toolkit';

import { selectConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { selectMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { selectMailSettings } from '@proton/mail/store/mailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import type { MailState } from 'proton-mail/store/rootReducer';

const labelID = (_: MailState, labelID: string) => labelID;

const getUnreadForLabel = (counts: LabelCount[] | undefined, labelID: string): number => {
    return counts?.find((count) => count.LabelID === labelID)?.Unread || 0;
};

/**
 * Return the unread count for any label ID
 */
export const selectLabelIDUnreadCount = createSelector(
    [selectConversationCounts, selectMessageCounts, selectDisabledCategoriesIDs, selectMailSettings, labelID],
    (conversationCounts, messageCounts, disabledCategoriesIDs, mailSettings, labelID) => {
        const counter = isConversationMode(labelID, mailSettings.value)
            ? conversationCounts.value
            : messageCounts.value;

        // The primary category contains the unread of every disabled category
        if (labelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT && disabledCategoriesIDs.length > 0) {
            return [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, ...disabledCategoriesIDs].reduce(
                (total, id) => total + getUnreadForLabel(counter, id),
                0
            );
        }

        return getUnreadForLabel(counter, labelID);
    }
);
