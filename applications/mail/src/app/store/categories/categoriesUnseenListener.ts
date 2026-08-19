import { selectConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { selectMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { updateLastSeenEventId } from '@proton/mail/store/labels/actions';
import { selectActiveCategoriesTabs, selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { selectMailSettings } from '@proton/mail/store/mailSettings';
import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount, MailSettings } from '@proton/shared/lib/interfaces';

import { isConversationMode } from '../../helpers/mailSettings';
import type { AppStartListening, MailState } from '../store';

const getCategoryUnread = (
    categoryID: string,
    mailSettings: MailSettings | undefined,
    conversationCounts: LabelCount[] | undefined,
    messageCounts: LabelCount[] | undefined
): number => {
    const counts = isConversationMode(categoryID, mailSettings) ? conversationCounts : messageCounts;
    return counts?.find((count) => count.LabelID === categoryID)?.Unread ?? 0;
};

const selectCategoryTabsUnread = (state: MailState): Partial<Record<CategoryLabelID, number>> => {
    const mailSettings = selectMailSettings(state).value;
    const conversationCounts = selectConversationCounts(state).value;
    const messageCounts = selectMessageCounts(state).value;
    const activeTabs = selectActiveCategoriesTabs(state);
    const disabledCategoryIDs = selectDisabledCategoriesIDs(state);
    const primaryCategoryIDs = [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, ...disabledCategoryIDs];

    const unreadCountPerCategory: Partial<Record<CategoryLabelID, number>> = {};
    for (const tab of activeTabs) {
        if (tab.id === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            unreadCountPerCategory[tab.id] = primaryCategoryIDs.reduce((total, id) => {
                return total + getCategoryUnread(id, mailSettings, conversationCounts, messageCounts);
            }, 0);
        } else {
            unreadCountPerCategory[tab.id] = getCategoryUnread(tab.id, mailSettings, conversationCounts, messageCounts);
        }
    }
    return unreadCountPerCategory;
};

/**
 * Mark the category tab as seen when all its elements have been read.
 */
export const startCategoriesUnseenListener = (startListening: AppStartListening) => {
    startListening({
        predicate: (_action, currentState, previousState) =>
            selectConversationCounts(currentState).value !== selectConversationCounts(previousState).value ||
            selectMessageCounts(currentState).value !== selectMessageCounts(previousState).value,
        effect: (_action, listenerApi) => {
            const previousUnread = selectCategoryTabsUnread(listenerApi.getOriginalState());
            const currentUnread = selectCategoryTabsUnread(listenerApi.getState());

            for (const categoryID of Object.keys(currentUnread) as CategoryLabelID[]) {
                const previous = previousUnread[categoryID] ?? 0;
                const current = currentUnread[categoryID] ?? 0;

                if (previous > 0 && current === 0) {
                    void listenerApi.dispatch(updateLastSeenEventId({ labelID: categoryID }));
                }
            }
        },
    });
};
