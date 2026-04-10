import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getTotal } from './elementTotal';

describe('getTotal', () => {
    it('should return the correct count with no filter', () => {
        const res = getTotal({
            counts: [{ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 45, Unread: 40 }],
            labelID: MAILBOX_LABEL_IDS.INBOX,
            categoryIDs: [],
            filter: {},
            bypassFilterCount: 0,
        });

        expect(res).toEqual(45);
    });

    it('should return the correct count with unread filter', () => {
        const res = getTotal({
            counts: [{ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 45, Unread: 40 }],
            labelID: MAILBOX_LABEL_IDS.INBOX,
            categoryIDs: [],
            filter: { Unread: 1 },
            bypassFilterCount: 0,
        });

        expect(res).toEqual(40);
    });

    it('should return the correct count with read filter', () => {
        const res = getTotal({
            counts: [{ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 45, Unread: 40 }],
            labelID: MAILBOX_LABEL_IDS.INBOX,
            categoryIDs: [],
            filter: { Unread: 0 },
            bypassFilterCount: 0,
        });

        expect(res).toEqual(5);
    });

    it('should return the correct count with unread filter and bypassFilterCount', () => {
        const res = getTotal({
            counts: [{ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 55, Unread: 50 }],
            labelID: MAILBOX_LABEL_IDS.INBOX,
            categoryIDs: [],
            filter: { Unread: 1 },
            bypassFilterCount: 5,
        });

        expect(res).toEqual(55);
    });

    it('should return the correct count with read filter and bypassFilterCount', () => {
        const res = getTotal({
            counts: [{ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 55, Unread: 5 }],
            labelID: MAILBOX_LABEL_IDS.INBOX,
            categoryIDs: [],
            filter: { Unread: 0 },
            bypassFilterCount: 5,
        });

        expect(res).toEqual(55);
    });

    it('should return the correct count for a non-inbox label', () => {
        const res = getTotal({
            counts: [{ LabelID: MAILBOX_LABEL_IDS.SENT, Total: 30, Unread: 0 }],
            labelID: MAILBOX_LABEL_IDS.SENT,
            categoryIDs: [],
            filter: {},
            bypassFilterCount: 0,
        });

        expect(res).toEqual(30);
    });

    it('should return 0 when no matching count entry is found', () => {
        const res = getTotal({
            counts: [],
            labelID: MAILBOX_LABEL_IDS.INBOX,
            categoryIDs: [],
            filter: {},
            bypassFilterCount: 0,
        });

        expect(res).toEqual(0);
    });

    describe('Category view cases', () => {
        it('should return the category total when present', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 100, Unread: 50 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Total: 20, Unread: 10 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                filter: {},
                bypassFilterCount: 0,
            });

            expect(res).toEqual(20);
        });

        it('should return 0 when the category has no matching count entry', () => {
            const res = getTotal({
                counts: [{ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 100, Unread: 50 }],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                filter: {},
                bypassFilterCount: 0,
            });

            expect(res).toEqual(0);
        });

        it('should return the primary total only if count for disabled category is not present', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 100, Unread: 50 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, Total: 30, Unread: 15 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                filter: {},
                bypassFilterCount: 0,
            });

            expect(res).toEqual(30);
        });

        it('should return the primary and disabled category totals', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 100, Unread: 50 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, Total: 30, Unread: 15 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Total: 20, Unread: 15 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                filter: {},
                bypassFilterCount: 0,
            });

            expect(res).toEqual(50);
        });

        it('should respect the unread filter with a category', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 100, Unread: 50 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Total: 20, Unread: 15 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                filter: { Unread: 1 },
                bypassFilterCount: 0,
            });

            expect(res).toEqual(15);
        });

        it('should respect the read filter with a category', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 100, Unread: 50 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Total: 20, Unread: 15 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                filter: { Unread: 0 },
                bypassFilterCount: 0,
            });

            expect(res).toEqual(5);
        });

        it('should respect bypassFilterCount with a category', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 100, Unread: 50 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Total: 20, Unread: 15 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                filter: { Unread: 1 },
                bypassFilterCount: 10,
            });

            expect(res).toEqual(25);
        });

        it('should respect the unread filter with default category aggregation', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, Total: 30, Unread: 15 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Total: 20, Unread: 10 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                filter: { Unread: 1 },
                bypassFilterCount: 0,
            });

            expect(res).toEqual(25);
        });

        it('should respect the read filter with default category aggregation', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, Total: 30, Unread: 15 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Total: 20, Unread: 10 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                filter: { Unread: 0 },
                bypassFilterCount: 0,
            });

            expect(res).toEqual(25);
        });

        it('should respect bypassFilterCount with default category aggregation', () => {
            const res = getTotal({
                counts: [
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, Total: 30, Unread: 15 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Total: 20, Unread: 10 },
                ],
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                filter: { Unread: 1 },
                bypassFilterCount: 5,
            });

            expect(res).toEqual(30);
        });
    });
});
