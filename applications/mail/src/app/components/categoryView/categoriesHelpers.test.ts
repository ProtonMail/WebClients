import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { CATEGORIES_COLOR_SHADES } from './categoriesConstants';
import { getCategoryCommanderKeyboardShortcut, getCategoryData } from './categoriesHelpers';

describe('categoriesHelpers', () => {
    describe('getCategoryData', () => {
        it.each([
            [
                '24',
                {
                    id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
                    icon: 'inbox-filled',
                },
            ],
            [
                '20',
                {
                    id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    colorShade: CATEGORIES_COLOR_SHADES.SKY,
                    icon: 'person-filled-2',
                },
            ],
            [
                '21',
                {
                    id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                    colorShade: CATEGORIES_COLOR_SHADES.TEAL,
                    icon: 'megaphone-filled',
                },
            ],
            [
                '25',
                {
                    id: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    colorShade: CATEGORIES_COLOR_SHADES.PINK,
                    icon: 'news',
                },
            ],
            [
                '26',
                {
                    id: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                    colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                    icon: 'credit-cards',
                },
            ],
            [
                '22',
                {
                    id: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                    colorShade: CATEGORIES_COLOR_SHADES.PURPLE,
                    icon: 'bell-filled-2',
                },
            ],
            [
                '23',
                {
                    id: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                    colorShade: CATEGORIES_COLOR_SHADES.AMBER,
                    icon: 'speech-bubbles-filled',
                },
            ],
        ])('should return proper values for %s', (id, expectedValues) => {
            expect(getCategoryData(id)).toEqual(expectedValues);
        });

        it('should throw if the ID is not part of the mapping', () => {
            expect(() => getCategoryData('27')).toThrow();
        });
    });

    describe('getCategoryCommanderKeyboardShortcut', () => {
        const testArray: [CategoryLabelID, string[]][] = [
            [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, ['G', 'I']],
            [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, ['C', 'S']],
            [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, ['C', 'P']],
            [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, ['C', 'N']],
            [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, ['C', 'T']],
            [MAILBOX_LABEL_IDS.CATEGORY_UPDATES, ['C', 'U']],
            [MAILBOX_LABEL_IDS.CATEGORY_FORUMS, ['C', 'F']],
        ];

        it.each(testArray)(
            'should return the correct label for the category %s when the category is %s',
            (category, expectedLabel) => {
                expect(getCategoryCommanderKeyboardShortcut(category).join('')).toBe(expectedLabel.join(''));
            }
        );
    });
});
