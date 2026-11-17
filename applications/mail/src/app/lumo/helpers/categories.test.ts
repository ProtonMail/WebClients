import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { categoryScopeName, coversPrimaryOnly, resolveCategoryLabelID, resolveInboxCategory } from './categories';
import { DefaultFolderReference } from './defaultFolders';

const promotionsTab: CategoryTab = {
    id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
    display: true,
    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
};

describe('resolveInboxCategory', () => {
    it('is absent when the model named no category', () => {
        expect(resolveInboxCategory({ target: DefaultFolderReference.INBOX, category: null })).toBeUndefined();
    });

    it('accepts a known category tab in the Inbox', () => {
        expect(resolveInboxCategory({ target: DefaultFolderReference.INBOX, category: 'promotions' })).toBe(
            'promotions'
        );
    });

    it.each([
        ['another default folder', DefaultFolderReference.ARCHIVE],
        ['a custom folder or label target', 'label-m3n4p5'],
    ])('rejects a category paired with %s', (_name, target) => {
        expect(() => resolveInboxCategory({ target, category: 'promotions' })).toThrow(/only applies with/);
    });

    it('rejects a category tab that does not exist', () => {
        expect(() => resolveInboxCategory({ target: DefaultFolderReference.INBOX, category: 'receipts' })).toThrow(
            /Unknown category/
        );
    });
});

describe('resolveCategoryLabelID', () => {
    it('resolves a tab the mailbox shows to its label id', () => {
        expect(resolveCategoryLabelID('promotions', [promotionsTab])).toBe(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
    });

    const socialTab: CategoryTab = { ...promotionsTab, id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL };

    it.each([
        ['the category view is off', []],
        ['the user hid that tab', [socialTab]],
    ])('rejects a tab when %s', (_case, tabs: CategoryTab[]) => {
        expect(() => resolveCategoryLabelID('promotions', tabs)).toThrow(/no "promotions" category tab/);
    });
});

describe('categoryScopeName', () => {
    it('names the tab inside its location by its display name', () => {
        expect(categoryScopeName('Inbox', 'promotions')).toBe('Inbox · Promotions');
    });
});

describe('coversPrimaryOnly', () => {
    it('is true for the Inbox with category tabs on and no tab named', () => {
        expect(coversPrimaryOnly({ target: DefaultFolderReference.INBOX, category: null }, true)).toBe(true);
    });

    it.each([
        ['category tabs are off', { target: DefaultFolderReference.INBOX, category: null }, false],
        ['a tab is named', { target: DefaultFolderReference.INBOX, category: 'promotions' }, true],
        ['the location is not the Inbox', { target: DefaultFolderReference.ARCHIVE, category: null }, true],
        ['there is no location', { target: null, category: null }, true],
    ])('is false when %s', (_case, scope, categoryTabsShown) => {
        expect(coversPrimaryOnly(scope, categoryTabsShown)).toBe(false);
    });
});
