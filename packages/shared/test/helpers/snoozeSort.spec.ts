import { getAppropriateSort } from '@proton/shared/lib/api/helpers/snoozeSort';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

describe('getAppropriateSort', () => {
    it('should return appropriate sort', () => {
        [
            // Should use SnoozeTime sorting
            { labelID: MAILBOX_LABEL_IDS.INBOX, sort: 'Time', expectedSort: 'SnoozeTime' },
            { labelID: MAILBOX_LABEL_IDS.SNOOZED, sort: 'Time', expectedSort: 'SnoozeTime' },
            // Should use Time sorting
            { labelID: [MAILBOX_LABEL_IDS.INBOX], sort: 'Time', expectedSort: 'Time' },
            { labelID: [MAILBOX_LABEL_IDS.SNOOZED], sort: 'Time', expectedSort: 'Time' },
            { labelID: MAILBOX_LABEL_IDS.TRASH, sort: 'Time', expectedSort: 'Time' },
            { labelID: undefined, sort: undefined, expectedSort: 'Time' },
            { labelID: MAILBOX_LABEL_IDS.SNOOZED, sort: undefined, expectedSort: 'Time' },
            { labelID: MAILBOX_LABEL_IDS.INBOX, sort: undefined, expectedSort: 'Time' },
            { labelID: [MAILBOX_LABEL_IDS.INBOX], sort: undefined, expectedSort: 'Time' },
            { labelID: [MAILBOX_LABEL_IDS.SNOOZED], sort: undefined, expectedSort: 'Time' },
            { labelID: MAILBOX_LABEL_IDS.TRASH, sort: undefined, expectedSort: 'Time' },
            // Should use other sorting
            { labelID: MAILBOX_LABEL_IDS.INBOX, sort: 'Size', expectedSort: 'Size' },
            { labelID: MAILBOX_LABEL_IDS.SNOOZED, sort: 'Size', expectedSort: 'Size' },
            { labelID: MAILBOX_LABEL_IDS.TRASH, sort: 'Size', expectedSort: 'Size' },
            { labelID: [MAILBOX_LABEL_IDS.SNOOZED], sort: 'Size', expectedSort: 'Size' },
        ].forEach(({ labelID, sort, expectedSort }) => {
            expect(getAppropriateSort(labelID, sort)).toEqual(expectedSort);
        });
    });
});
