import { getActiveState } from './filterListHelpers';

const getState = (override: Partial<ReturnType<typeof getActiveState>> = {}) => {
    return {
        showReset: true,
        isUnreadActive: false,
        isReadActive: false,
        isAttachmentActive: false,
        isNewestFirstActive: false,
        isOldestFirstActive: false,
        isLargestFirstActive: false,
        isSmallestFirstActive: false,
        dropdownActiveCount: 0,
        ...override,
    };
};

describe('getActiveState', () => {
    describe('non-scheduled', () => {
        it('should inicate unread active', () => {
            const result = getActiveState({ Unread: 1 }, { sort: 'Time', desc: true }, false);
            const expected = getState({ isUnreadActive: true, isNewestFirstActive: true });
            expect(result).toEqual(expected);
        });

        it('should indicate read active', () => {
            const result = getActiveState({ Unread: 0 }, { sort: 'Time', desc: true }, false);
            const expected = getState({ isReadActive: true, isNewestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate attachment active', () => {
            const result = getActiveState({ Attachments: 1 }, { sort: 'Time', desc: true }, false);
            const expected = getState({ isAttachmentActive: true, isNewestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate oldest first active', () => {
            const result = getActiveState({}, { sort: 'Time', desc: false }, false);
            const expected = getState({ isOldestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate largest first active', () => {
            const result = getActiveState({}, { sort: 'Size', desc: true }, false);
            const expected = getState({ isLargestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate smallest first active', () => {
            const result = getActiveState({}, { sort: 'Size', desc: false }, false);
            const expected = getState({ isSmallestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should show two dropdown count', () => {
            const result = getActiveState({ Unread: 0 }, { sort: 'Size', desc: true }, false);
            const expected = getState({ isLargestFirstActive: true, isReadActive: true, dropdownActiveCount: 2 });
            expect(result).toEqual(expected);
        });
    });

    describe('scheduled', () => {
        it('should inicate unread active', () => {
            const result = getActiveState({ Unread: 1 }, { sort: 'Time', desc: false }, true);
            const expected = getState({ isUnreadActive: true, isNewestFirstActive: true });
            expect(result).toEqual(expected);
        });

        it('should indicate read active', () => {
            const result = getActiveState({ Unread: 0 }, { sort: 'Time', desc: false }, true);
            const expected = getState({ isReadActive: true, isNewestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate attachment active', () => {
            const result = getActiveState({ Attachments: 1 }, { sort: 'Time', desc: false }, true);
            const expected = getState({ isAttachmentActive: true, isNewestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate oldest first active', () => {
            const result = getActiveState({}, { sort: 'Time', desc: true }, true);
            const expected = getState({ isOldestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate largest first active', () => {
            const result = getActiveState({}, { sort: 'Size', desc: true }, true);
            const expected = getState({ isLargestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate smallest first active', () => {
            const result = getActiveState({}, { sort: 'Size', desc: false }, true);
            const expected = getState({ isSmallestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should show two dropdown count', () => {
            const result = getActiveState({ Unread: 0 }, { sort: 'Size', desc: true }, true);
            const expected = getState({ isLargestFirstActive: true, isReadActive: true, dropdownActiveCount: 2 });
            expect(result).toEqual(expected);
        });
    });
});
