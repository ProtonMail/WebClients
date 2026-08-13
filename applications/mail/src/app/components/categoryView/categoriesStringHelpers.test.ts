import {
    getDescriptionFromCategoryId,
    getLabelFromCategoryId,
    getLabelFromCategoryIdInCommander,
    getTitleFromCategoryId,
} from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

describe('categoriesStringHelpers', () => {
    describe('getLabelFromCategoryId', () => {
        it('should getLabelFromCategoryId for default', () => {
            expect(getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toBe('Primary');
        });

        it('should getLabelFromCategoryId for social', () => {
            expect(getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL)).toBe('Social');
        });

        it('should getLabelFromCategoryId for promotions', () => {
            expect(getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS)).toBe('Promotions');
        });

        it('should getLabelFromCategoryId for newsletters', () => {
            expect(getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)).toBe('Newsletters');
        });

        it('should getLabelFromCategoryId for transactions', () => {
            expect(getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS)).toBe('Transactions');
        });

        it('should getLabelFromCategoryId for updates', () => {
            expect(getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_UPDATES)).toBe('Updates');
        });
    });

    describe('getTitleFromCategoryId', () => {
        it('should getTitleFromCategoryId for default', () => {
            expect(getTitleFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toBe(
                'Primary - Anything that needs your attention, plus emails from disabled categories'
            );
        });

        it('should getTitleFromCategoryId for social', () => {
            expect(getTitleFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL)).toBe(
                'Social - Social media updates, activity, and messages'
            );
        });

        it('should getTitleFromCategoryId for promotions', () => {
            expect(getTitleFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS)).toBe(
                'Promotions - Deals, offers, and marketing emails'
            );
        });

        it('should getTitleFromCategoryId for newsletters', () => {
            expect(getTitleFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)).toBe(
                'Newsletters - News, editorial emails, and non-promotional content'
            );
        });

        it('should getTitleFromCategoryId for transactions', () => {
            expect(getTitleFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS)).toBe(
                'Transactions - Receipts, bookings, bills, and orders'
            );
        });

        it('should getTitleFromCategoryId for updates', () => {
            expect(getTitleFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_UPDATES)).toBe(
                'Updates - Automated confirmations, alerts, and account updates'
            );
        });
    });

    describe('getDescriptionFromCategoryId', () => {
        it('should getDescriptionFromCategoryId for default', () => {
            expect(getDescriptionFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toBe(
                'Anything that needs your attention, plus emails from disabled categories'
            );
        });

        it('should getDescriptionFromCategoryId for social', () => {
            expect(getDescriptionFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL)).toBe(
                'Social media updates and activity'
            );
        });

        it('should getDescriptionFromCategoryId for promotions', () => {
            expect(getDescriptionFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS)).toBe(
                'Deals, offers, and marketing emails'
            );
        });

        it('should getDescriptionFromCategoryId for newsletters', () => {
            expect(getDescriptionFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)).toBe(
                'Non-promotional content and news'
            );
        });

        it('should getDescriptionFromCategoryId for transactions', () => {
            expect(getDescriptionFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS)).toBe(
                'Bookings, billings, and orders'
            );
        });

        it('should getDescriptionFromCategoryId for updates', () => {
            expect(getDescriptionFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_UPDATES)).toBe(
                'Automated confirmations and alerts'
            );
        });
    });

    describe('getLabelFromCategoryIdInCommander', () => {
        it('should getLabelFromCategoryIdInCommander for default', () => {
            expect(getLabelFromCategoryIdInCommander(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toBe('Go to Primary');
        });

        it('should getLabelFromCategoryIdInCommander for social', () => {
            expect(getLabelFromCategoryIdInCommander(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL)).toBe('Go to Social');
        });

        it('should getLabelFromCategoryIdInCommander for promotions', () => {
            expect(getLabelFromCategoryIdInCommander(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS)).toBe('Go to Promotions');
        });

        it('should getLabelFromCategoryIdInCommander for newsletters', () => {
            expect(getLabelFromCategoryIdInCommander(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)).toBe('Go to Newsletters');
        });

        it('should getLabelFromCategoryIdInCommander for transactions', () => {
            expect(getLabelFromCategoryIdInCommander(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS)).toBe(
                'Go to Transactions'
            );
        });

        it('should getLabelFromCategoryIdInCommander for updates', () => {
            expect(getLabelFromCategoryIdInCommander(MAILBOX_LABEL_IDS.CATEGORY_UPDATES)).toBe('Go to Updates');
        });
    });
});
