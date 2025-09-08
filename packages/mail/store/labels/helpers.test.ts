import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

import { sortSystemCategories } from './helpers';

const baseLabel: Label = {
    ID: 'id',
    Name: 'name',
    Color: '#000000',
    Type: 4,
    Order: 0,
    Path: '',
};

describe('helpers', () => {
    describe('sortSystemCategories', () => {
        it('should sort the labels according to list', () => {
            const result = sortSystemCategories([
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                },
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                },
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                },
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                },
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                },
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                },
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                },
            ]);

            expect(result.length).toBe(7);
            expect(result[0].ID).toBe(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
            expect(result[1].ID).toBe(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(result[2].ID).toBe(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
        });

        it('should not push non-categories IDs', () => {
            const result = sortSystemCategories([
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                },
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.SPAM,
                },
                {
                    ...baseLabel,
                    ID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                },
            ]);

            expect(result.length).toBe(2);
            expect(result[0].ID).toBe(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
            expect(result[1].ID).toBe(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
        });

        it('should not crash if getting an empty array', () => {
            const result = sortSystemCategories([]);

            expect(result.length).toBe(0);
        });
    });
});
