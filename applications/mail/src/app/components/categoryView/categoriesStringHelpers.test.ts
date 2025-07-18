import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getLabelFromCategoryId } from './categoriesStringHelpers';

describe('categoriesStringHelpers', () => {
    it.each([
        [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 'Primary'],
        [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, 'Social'],
        [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 'Promotions'],
        [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, 'Newsletters'],
        [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 'Transactions'],
        [MAILBOX_LABEL_IDS.CATEGORY_UPDATES, 'Updates'],
        [MAILBOX_LABEL_IDS.CATEGORY_FORUMS, 'Forums'],
    ])('should return the correct label for the category %s when the category is %s', (category, expectedLabel) => {
        expect(getLabelFromCategoryId(category)).toBe(expectedLabel);
    });

    it('should return unknown when the category is not found', () => {
        expect(getLabelFromCategoryId('unknown' as MAILBOX_LABEL_IDS)).toBe('Unknown');
    });
});
