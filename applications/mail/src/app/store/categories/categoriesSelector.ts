import { createSelector } from '@reduxjs/toolkit';

import { selectCategoryViewSettingAccess } from '@proton/mail/store/categoriesView/categoriesViewSelector';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectCategoryIDs, selectIsSearching, selectLabelID } from '../elements/elementsSelectors';

/**
 * Returns a boolean that is true when the user is a non-primary category.
 * The selector ensure the user is in Inbox and category view is enabled.
 */
export const selectShouldShowMoveToPrimaryBadge = createSelector(
    [selectLabelID, selectCategoryIDs, selectCategoryViewSettingAccess],
    (labelID, categoryIDs, settingAccess) => {
        const isLabelIDInbox = labelID === MAILBOX_LABEL_IDS.INBOX;
        const isNotInPrimary = categoryIDs.length > 0 && !categoryIDs.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);

        return isLabelIDInbox && isNotInPrimary && settingAccess;
    }
);

/**
 * Base check to determine if the category view tab can be displayed to the user.
 * The user must be in Inbox and not searching to see them.
 */
export const selectShouldShowCategoryViewTabs = createSelector(
    [selectIsSearching, selectLabelID],
    (isSearching, labelID) => labelID === MAILBOX_LABEL_IDS.INBOX && !isSearching
);
