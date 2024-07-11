import { getAppropriateSort } from '@proton/shared/lib/api/helpers/snoozeSort';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

const { INBOX, SNOOZED, TRASH } = MAILBOX_LABEL_IDS;

describe('getAppropriateSort', () => {
    it('should return appropriate sort', () => {
        [
            // Should use SnoozeTime sorting
            { labelID: INBOX, sort: 'Time', expectedSort: 'SnoozeTime' },
            { labelID: SNOOZED, sort: 'Time', expectedSort: 'SnoozeTime' },
            // Should use Time sorting
            { labelID: [INBOX], sort: 'Time', expectedSort: 'Time' },
            { labelID: [SNOOZED], sort: 'Time', expectedSort: 'Time' },
            { labelID: TRASH, sort: 'Time', expectedSort: 'Time' },
            { labelID: undefined, sort: undefined, expectedSort: 'Time' },
            { labelID: SNOOZED, sort: undefined, expectedSort: 'Time' },
            { labelID: INBOX, sort: undefined, expectedSort: 'Time' },
            { labelID: [INBOX], sort: undefined, expectedSort: 'Time' },
            { labelID: [SNOOZED], sort: undefined, expectedSort: 'Time' },
            { labelID: TRASH, sort: undefined, expectedSort: 'Time' },
            // Should use other sorting
            { labelID: INBOX, sort: 'Size', expectedSort: 'Size' },
            { labelID: SNOOZED, sort: 'Size', expectedSort: 'Size' },
            { labelID: TRASH, sort: 'Size', expectedSort: 'Size' },
            { labelID: [SNOOZED], sort: 'Size', expectedSort: 'Size' },
        ].forEach(({ labelID, sort, expectedSort }) => {
            expect(getAppropriateSort(labelID, sort)).toEqual(expectedSort);
        });
    });
});
