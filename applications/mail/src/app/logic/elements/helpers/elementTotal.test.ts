import { LabelCount } from '@proton/shared/lib/interfaces';

import { getTotal } from './elementTotal';

describe('getTotal', () => {
    it('should return the correct count with no filter', () => {
        const labelID = '1';

        const labelCounts = [
            {
                LabelID: labelID,
                Total: 45,
                Unread: 45,
            },
        ] as LabelCount[];

        expect(getTotal(labelCounts, labelID, {}, 0)).toEqual(45);
    });

    it('should return the correct count with unread filter', () => {
        const labelID = '1';

        const labelCounts = [
            {
                LabelID: labelID,
                Total: 45,
                Unread: 40,
            },
        ] as LabelCount[];

        expect(getTotal(labelCounts, labelID, { Unread: 1 }, 0)).toEqual(40);
    });

    it('should return the correct count with read filter', () => {
        const labelID = '1';

        const labelCounts = [
            {
                LabelID: labelID,
                Total: 45,
                Unread: 40,
            },
        ] as LabelCount[];

        expect(getTotal(labelCounts, labelID, { Unread: 0 }, 0)).toEqual(5);
    });

    it('should return the correct count with unread filter and bypassFilter', () => {
        const labelID = '1';

        const labelCounts = [
            {
                LabelID: labelID,
                Total: 55,
                Unread: 50,
            },
        ] as LabelCount[];

        expect(getTotal(labelCounts, labelID, { Unread: 1 }, 5)).toEqual(55);
    });

    it('should return the correct count with unread filter and bypassFilter', () => {
        const labelID = '1';

        const labelCounts = [
            {
                LabelID: labelID,
                Total: 55,
                Unread: 5,
            },
        ] as LabelCount[];

        expect(getTotal(labelCounts, labelID, { Unread: 0 }, 5)).toEqual(55);
    });
});
