import { createSelector } from '@reduxjs/toolkit';

import { selectCategoryViewSettingAccess } from '@proton/mail/store/categoriesView/categoriesViewSelector';
import { selectMailSettings } from '@proton/mail/store/mailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectCategoryIDs, selectIsSearching, selectLabelID, selectPage } from '../elements/elementsSelectors';

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

/**
 * Reporting must only happen once the first page of results is the one displayed:
 * we prefetch a second page on load, but only the first page's counts are meaningful.
 * `selectLoading` isn't used here because it takes a `page` prop (see elementsSelectors),
 * so "not loading" is checked by the caller using the already-computed `ElementsStructure.loading`.
 */
export const selectShouldReportUnreadCount = createSelector(
    [selectCategoryIDs, selectLabelID, selectPage, selectMailSettings],
    (categoryIDs, labelID, page, mailSettings) => {
        const isInboxOrOnPrimary =
            labelID === MAILBOX_LABEL_IDS.INBOX &&
            (mailSettings.value?.MailCategoryView ? categoryIDs.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) : true);

        return isInboxOrOnPrimary && page === 0;
    }
);
