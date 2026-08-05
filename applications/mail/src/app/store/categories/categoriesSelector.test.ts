import { mailSettingsState } from '@proton/mail/store/mailSettings/mailSettings.testing';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { MailStateSlice } from '../buildMailState.testing';
import { buildMailState } from '../buildMailState.testing';
import { elementsState } from '../elements/elementsSlice.testing';
import { organizationState, unloadedOrganizationState } from '../sharedSlices.testing';
import { selectShouldShowCategoryViewTabs, selectShouldShowMoveToPrimaryBadge } from './categoriesSelector';

const CATEGORIES: CategoryLabelID[] = [
    MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
];

const inboxElements = (categoryIDs: CategoryLabelID[], isSearching = false) =>
    elementsState({ params: { labelID: MAILBOX_LABEL_IDS.INBOX, categoryIDs, isSearching } });

describe('selectShouldShowCategoryViewTabs', () => {
    it('returns true in Inbox when not searching', () => {
        const state = buildMailState(inboxElements(CATEGORIES));
        expect(selectShouldShowCategoryViewTabs(state)).toBe(true);
    });

    it('returns false outside of Inbox', () => {
        const state = buildMailState(elementsState({ params: { labelID: MAILBOX_LABEL_IDS.DRAFTS } }));
        expect(selectShouldShowCategoryViewTabs(state)).toBe(false);
    });

    it('returns false while searching', () => {
        const state = buildMailState(inboxElements(CATEGORIES, true));
        expect(selectShouldShowCategoryViewTabs(state)).toBe(false);
    });
});

describe('selectShouldShowMoveToPrimaryBadge', () => {
    /**
     * Inbox, on the Social category, with the category view enabled for the user and the
     * organization. Append a slice to override one of them.
     */
    const badgeState = (...slices: MailStateSlice[]) =>
        buildMailState(
            inboxElements([MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]),
            mailSettingsState({ MailCategoryView: true }),
            organizationState({ MailCategoryViewEnabled: true }),
            ...slices
        );

    it('returns true in Inbox on a non-primary category with settings enabled', () => {
        expect(selectShouldShowMoveToPrimaryBadge(badgeState())).toBe(true);
    });

    it('returns false in Inbox while viewing the Primary category', () => {
        const state = badgeState(inboxElements([MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]));
        expect(selectShouldShowMoveToPrimaryBadge(state)).toBe(false);
    });

    it('returns false in Inbox while viewing Primary alongside other categories', () => {
        const state = badgeState(inboxElements(CATEGORIES));
        expect(selectShouldShowMoveToPrimaryBadge(state)).toBe(false);
    });

    it('returns true in Inbox when no category is selected', () => {
        // An empty list means no category filter is applied, which does not include Primary.
        const state = badgeState(inboxElements([]));
        expect(selectShouldShowMoveToPrimaryBadge(state)).toBe(false);
    });

    it('returns false outside of Inbox', () => {
        const state = badgeState(elementsState({ params: { labelID: MAILBOX_LABEL_IDS.DRAFTS } }));
        expect(selectShouldShowMoveToPrimaryBadge(state)).toBe(false);
    });

    it('returns false when the per-user setting is disabled', () => {
        const state = badgeState(mailSettingsState({ MailCategoryView: false }));
        expect(selectShouldShowMoveToPrimaryBadge(state)).toBe(false);
    });

    it('returns false when the organization disables category view', () => {
        const state = badgeState(organizationState({ MailCategoryViewEnabled: false }));
        expect(selectShouldShowMoveToPrimaryBadge(state)).toBe(false);
    });

    it('returns false when the organization is not loaded yet', () => {
        const state = badgeState(unloadedOrganizationState());
        expect(selectShouldShowMoveToPrimaryBadge(state)).toBe(false);
    });
});
