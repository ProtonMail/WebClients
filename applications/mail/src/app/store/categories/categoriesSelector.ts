import { createSelector } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectIsSearching, selectLabelID } from '../elements/elementsSelectors';

/**
 * Base check to determine if the category view tab can be dispalyed to the user.
 * The user must be in Inbox and not searching to see them.
 */
export const selectShouldShowCategoryViewTabs = createSelector(
    [selectIsSearching, selectLabelID],
    (isSearching, labelID) => labelID === MAILBOX_LABEL_IDS.INBOX && !isSearching
);
