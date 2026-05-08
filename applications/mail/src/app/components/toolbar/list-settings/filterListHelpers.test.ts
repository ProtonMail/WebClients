import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

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
        it('should inicate unread active, no reset button', () => {
            const result = getActiveState({ Unread: 1 }, { sort: 'Time', desc: true }, MAILBOX_LABEL_IDS.SENT);
            const expected = getState({ isUnreadActive: true, isNewestFirstActive: true, showReset: false });
            expect(result).toEqual(expected);
        });

        it('should indicate read active', () => {
            const result = getActiveState({ Unread: 0 }, { sort: 'Time', desc: true }, MAILBOX_LABEL_IDS.SENT);
            const expected = getState({ isReadActive: true, isNewestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate attachment active', () => {
            const result = getActiveState({ Attachments: 1 }, { sort: 'Time', desc: true }, MAILBOX_LABEL_IDS.SENT);
            const expected = getState({ isAttachmentActive: true, isNewestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate oldest first active', () => {
            const result = getActiveState({}, { sort: 'Time', desc: false }, MAILBOX_LABEL_IDS.SENT);
            const expected = getState({ isOldestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate largest first active', () => {
            const result = getActiveState({}, { sort: 'Size', desc: true }, MAILBOX_LABEL_IDS.SENT);
            const expected = getState({ isLargestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate smallest first active', () => {
            const result = getActiveState({}, { sort: 'Size', desc: false }, MAILBOX_LABEL_IDS.SENT);
            const expected = getState({ isSmallestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should show two dropdown count', () => {
            const result = getActiveState({ Unread: 0 }, { sort: 'Size', desc: true }, MAILBOX_LABEL_IDS.SENT);
            const expected = getState({ isLargestFirstActive: true, isReadActive: true, dropdownActiveCount: 2 });
            expect(result).toEqual(expected);
        });
    });

    describe('inbox / snoozed (SnoozeTime sort)', () => {
        it('should indicate newest first active for inbox with SnoozeTime desc', () => {
            const result = getActiveState({ Unread: 1 }, { sort: 'SnoozeTime', desc: true }, MAILBOX_LABEL_IDS.INBOX);
            const expected = getState({ isUnreadActive: true, isNewestFirstActive: true, showReset: false });
            expect(result).toEqual(expected);
        });

        it('should indicate newest first active for snoozed with SnoozeTime desc', () => {
            const result = getActiveState({ Unread: 1 }, { sort: 'SnoozeTime', desc: true }, MAILBOX_LABEL_IDS.SNOOZED);
            const expected = getState({ isUnreadActive: true, isNewestFirstActive: true, showReset: false });
            expect(result).toEqual(expected);
        });

        it('should treat SnoozeTime asc as non-default sort', () => {
            const result = getActiveState({}, { sort: 'SnoozeTime', desc: false }, MAILBOX_LABEL_IDS.INBOX);
            const expected = getState({ dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should not treat SnoozeTime as newest first for non-inbox labels', () => {
            const result = getActiveState({}, { sort: 'SnoozeTime', desc: true }, MAILBOX_LABEL_IDS.SENT);
            const expected = getState({ dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });
    });

    describe('scheduled', () => {
        it('should inicate unread active, no reset button', () => {
            const result = getActiveState({ Unread: 1 }, { sort: 'Time', desc: false }, MAILBOX_LABEL_IDS.SCHEDULED);
            const expected = getState({ isUnreadActive: true, isNewestFirstActive: true, showReset: false });
            expect(result).toEqual(expected);
        });

        it('should indicate read active', () => {
            const result = getActiveState({ Unread: 0 }, { sort: 'Time', desc: false }, MAILBOX_LABEL_IDS.SCHEDULED);
            const expected = getState({ isReadActive: true, isNewestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate attachment active', () => {
            const result = getActiveState(
                { Attachments: 1 },
                { sort: 'Time', desc: false },
                MAILBOX_LABEL_IDS.SCHEDULED
            );
            const expected = getState({ isAttachmentActive: true, isNewestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate oldest first active', () => {
            const result = getActiveState({}, { sort: 'Time', desc: true }, MAILBOX_LABEL_IDS.SCHEDULED);
            const expected = getState({ isOldestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate largest first active', () => {
            const result = getActiveState({}, { sort: 'Size', desc: true }, MAILBOX_LABEL_IDS.SCHEDULED);
            const expected = getState({ isLargestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should indicate smallest first active', () => {
            const result = getActiveState({}, { sort: 'Size', desc: false }, MAILBOX_LABEL_IDS.SCHEDULED);
            const expected = getState({ isSmallestFirstActive: true, dropdownActiveCount: 1 });
            expect(result).toEqual(expected);
        });

        it('should show two dropdown count', () => {
            const result = getActiveState({ Unread: 0 }, { sort: 'Size', desc: true }, MAILBOX_LABEL_IDS.SCHEDULED);
            const expected = getState({ isLargestFirstActive: true, isReadActive: true, dropdownActiveCount: 2 });
            expect(result).toEqual(expected);
        });
    });
});
