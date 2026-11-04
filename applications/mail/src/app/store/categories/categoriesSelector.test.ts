import { mailSettingsState, unloadedMailSettingsState } from '@proton/mail/store/mailSettings/mailSettings.testing';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { MailStateSlice } from '../tests/buildMailState';
import { buildMailState } from '../tests/buildMailState';
import { elementsState } from '../tests/elementsSlice';
import {
    selectCanMoveToCategories,
    selectShouldReportUnreadCount,
    selectShouldShowCategoryViewTabs,
} from './categoriesSelector';

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

describe('selectCanMoveToCategories', () => {
    it('returns true in Inbox when not searching', () => {
        expect(selectCanMoveToCategories(buildMailState(inboxElements(CATEGORIES)))).toBe(true);
    });

    it('returns true when searching in a category', () => {
        const state = buildMailState(inboxElements([MAILBOX_LABEL_IDS.CATEGORY_SOCIAL], true));
        expect(selectCanMoveToCategories(state)).toBe(true);
    });

    it('returns false when searching outside of a category', () => {
        const state = buildMailState(
            elementsState({ params: { labelID: MAILBOX_LABEL_IDS.ALL_MAIL, isSearching: true } })
        );
        expect(selectCanMoveToCategories(state)).toBe(false);
    });

    it('returns false outside of Inbox', () => {
        const state = buildMailState(elementsState({ params: { labelID: MAILBOX_LABEL_IDS.DRAFTS } }));
        expect(selectCanMoveToCategories(state)).toBe(false);
    });
});

describe('selectShouldReportUnreadCount', () => {
    /**
     * Inbox, on the Primary category, with category view enabled, viewing the first page.
     * Append a slice to override one of them.
     */
    const reportState = (categoryIDs: CategoryLabelID[], page = 0, ...slices: MailStateSlice[]) =>
        buildMailState(
            elementsState({ params: { labelID: MAILBOX_LABEL_IDS.INBOX, categoryIDs }, page }),
            mailSettingsState({ MailCategoryView: true }),
            ...slices
        );

    it('returns true in Inbox on Primary on the first page', () => {
        const state = reportState([MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]);
        expect(selectShouldReportUnreadCount(state)).toBe(true);
    });

    it('returns true in Inbox on Primary alongside other categories', () => {
        const state = reportState(CATEGORIES);
        expect(selectShouldReportUnreadCount(state)).toBe(true);
    });

    it('returns false in Inbox on a non-primary category', () => {
        const state = reportState([MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]);
        expect(selectShouldReportUnreadCount(state)).toBe(false);
    });

    it('returns true in Inbox when category view is disabled for the user', () => {
        // Category view disabled: useElements never populates categoryIDs, so it falls back to plain Inbox.
        const state = reportState([], 0, mailSettingsState({ MailCategoryView: false }));
        expect(selectShouldReportUnreadCount(state)).toBe(true);
    });

    it('returns true in Inbox when mail settings are still loading', () => {
        // Optional chaining on an unloaded `value` must default to the plain Inbox check, not throw.
        const state = buildMailState(
            elementsState({ params: { labelID: MAILBOX_LABEL_IDS.INBOX, categoryIDs: [] } }),
            unloadedMailSettingsState()
        );
        expect(selectShouldReportUnreadCount(state)).toBe(true);
    });

    it('returns false outside of Inbox', () => {
        const state = buildMailState(
            elementsState({ params: { labelID: MAILBOX_LABEL_IDS.DRAFTS } }),
            mailSettingsState({ MailCategoryView: true })
        );
        expect(selectShouldReportUnreadCount(state)).toBe(false);
    });

    it('returns false past the first page, even on Inbox/Primary', () => {
        const state = reportState([MAILBOX_LABEL_IDS.CATEGORY_DEFAULT], 1);
        expect(selectShouldReportUnreadCount(state)).toBe(false);
    });
});
