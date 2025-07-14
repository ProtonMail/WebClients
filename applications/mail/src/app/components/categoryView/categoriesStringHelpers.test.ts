import { CATEGORY_LABEL_IDS } from './categoriesConstants';
import { getLabelFromCategoryId } from './categoriesStringHelpers';

describe('categoriesStringHelpers', () => {
    it.each([
        [CATEGORY_LABEL_IDS.CATEGORY_DEFAULT, 'Primary'],
        [CATEGORY_LABEL_IDS.CATEGORY_SOCIAL, 'Social'],
        [CATEGORY_LABEL_IDS.CATEGORY_PROMOTIONS, 'Promotions'],
        [CATEGORY_LABEL_IDS.CATEGORY_NEWSLETTER, 'Newsletters'],
        [CATEGORY_LABEL_IDS.CATEGORY_TRANSACTIONS, 'Transactions'],
        [CATEGORY_LABEL_IDS.CATEGORY_UPDATES, 'Updates'],
        [CATEGORY_LABEL_IDS.CATEGORY_FORUMS, 'Forums'],
    ])('should return the correct label for the category %s when the category is %s', (category, expectedLabel) => {
        expect(getLabelFromCategoryId(category)).toBe(expectedLabel);
    });

    it('should return unknown when the category is not found', () => {
        expect(getLabelFromCategoryId('unknown' as CATEGORY_LABEL_IDS)).toBe('Unknown');
    });
});
