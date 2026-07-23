import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { isLastEnabledCategory } from './CategoriesViewSections.helper';

const generateActiveTab = (id: CategoryLabelID): CategoryTab => ({
    id,
    display: true,
    notify: true,
    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
});

describe('isLastEnabledCategory', () => {
    it('should return true when the category is the only enabled non-primary category', () => {
        const activeTabs = [generateActiveTab(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)];
        expect(isLastEnabledCategory(activeTabs, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)).toBe(true);
    });

    it('should ignore the primary category when counting enabled categories', () => {
        const activeTabs = [
            generateActiveTab(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT),
            generateActiveTab(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL),
        ];
        expect(isLastEnabledCategory(activeTabs, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL)).toBe(true);
    });

    it('should return false when more than one non-primary category is enabled', () => {
        const activeTabs = [
            generateActiveTab(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL),
            generateActiveTab(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS),
        ];
        expect(isLastEnabledCategory(activeTabs, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL)).toBe(false);
    });

    it('should return false when the only enabled category is not the one being checked', () => {
        const activeTabs = [generateActiveTab(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL)];
        expect(isLastEnabledCategory(activeTabs, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)).toBe(false);
    });

    it('should return false when only the primary category is enabled', () => {
        const activeTabs = [generateActiveTab(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)];
        expect(isLastEnabledCategory(activeTabs, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toBe(false);
    });

    it('should return false when no category is enabled', () => {
        expect(isLastEnabledCategory([], MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)).toBe(false);
    });
});
