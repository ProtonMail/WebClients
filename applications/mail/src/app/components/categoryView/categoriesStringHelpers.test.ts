import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getDescriptionFromCategoryId, getLabelFromCategoryId } from './categoriesStringHelpers';

describe('categoriesStringHelpers', () => {
    describe('getLabelFromCategoryId', () => {
        const testArray: [CategoryLabelID, string][] = [
            [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 'Primary'],
            [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, 'Social'],
            [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 'Promotions'],
            [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, 'Newsletters'],
            [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 'Transactions'],
            [MAILBOX_LABEL_IDS.CATEGORY_UPDATES, 'Updates'],
            [MAILBOX_LABEL_IDS.CATEGORY_FORUMS, 'Forums'],
        ];

        it.each(testArray)(
            'should return the correct label for the category %s when the category is %s',
            (category, expectedLabel) => {
                expect(getLabelFromCategoryId(category)).toBe(expectedLabel);
            }
        );
    });

    describe('getDescriptionFromCategoryId', () => {
        const testArray: [CategoryLabelID, string][] = [
            [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 'Primary'],
            [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, 'Social media updates and activity'],
            [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 'Deals, offers, marketing emails'],
            [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, 'Non-promotional content and news'],
            [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 'Bookings, billings, and orders'],
            [MAILBOX_LABEL_IDS.CATEGORY_UPDATES, 'Automated confirmations and alerts'],
            [MAILBOX_LABEL_IDS.CATEGORY_FORUMS, 'Discussion board posts and threads'],
        ];

        it.each(testArray)(
            'should return the correct label for the category %s when the category is %s',
            (category, expectedLabel) => {
                expect(getDescriptionFromCategoryId(category)).toBe(expectedLabel);
            }
        );
    });
});
