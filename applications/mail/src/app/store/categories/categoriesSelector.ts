import { createSelector } from '@reduxjs/toolkit';

import { selectOrganization } from '@proton/account/organization';
import { selectMailSettings } from '@proton/mail/store/mailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectCategoryIDs, selectIsSearching, selectLabelID } from '../elements/elementsSelectors';

/**
 * Returns a boolean that is true when the user is a non-primary category.
 * The selector ensure the user is in Inbox and category view is enabled.
 */
export const selectShouldShowMoveToPrimaryBadge = createSelector(
    [selectMailSettings, selectOrganization, selectLabelID, selectCategoryIDs],
    (mailSettings, organization, labelID, categoryIDs) => {
        const isLabelIDInbox = labelID === MAILBOX_LABEL_IDS.INBOX;
        const isNotInPrimary = !categoryIDs.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);

        const settingAccess = organization.value?.Settings?.MailCategoryViewEnabled
            ? (mailSettings.value?.MailCategoryView ?? false)
            : false;

        return isLabelIDInbox && isNotInPrimary && settingAccess;
    }
);

/**
 * Base check to determine if the category view tab can be dispalyed to the user.
 * The user must be in Inbox and not searching to see them.
 */
export const selectShouldShowCategoryViewTabs = createSelector(
    [selectIsSearching, selectLabelID],
    (isSearching, labelID) => labelID === MAILBOX_LABEL_IDS.INBOX && !isSearching
);
