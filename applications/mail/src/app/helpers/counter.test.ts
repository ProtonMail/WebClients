import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { updateCounters } from './counter';

describe('updateCounters', () => {
    it('should update counters', () => {
        const message = { Unread: 1, ConversationID: 'ConversationID' } as Message;
        const counters = [
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 1, Unread: 1 },
            { LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Total: 0, Unread: 0 },
        ] as LabelCount[];
        const changes = { [MAILBOX_LABEL_IDS.ARCHIVE]: true, [MAILBOX_LABEL_IDS.INBOX]: false };
        const newCounters = updateCounters(message, counters, changes);
        const inboxCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
        const archiveCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ARCHIVE);

        expect(inboxCounter?.Total).toEqual(0);
        expect(inboxCounter?.Unread).toEqual(0);
        expect(archiveCounter?.Total).toEqual(1);
        expect(archiveCounter?.Unread).toEqual(1);
    });

    it('should not change unmodifiable label', () => {
        const message = { ConversationID: 'ConversationID' } as Message;
        const counters = [] as LabelCount[];
        const changes = {
            [MAILBOX_LABEL_IDS.ALL_DRAFTS]: false,
            [MAILBOX_LABEL_IDS.ALL_SENT]: false,
            [MAILBOX_LABEL_IDS.ALL_MAIL]: false,
        };
        const newCounters = updateCounters(message, counters, changes);
        const allDraftsCounter = newCounters.some(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ALL_DRAFTS);
        const allSentCounter = newCounters.some(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ALL_SENT);
        const allMailCounter = newCounters.some(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);

        expect(allDraftsCounter).toEqual(false);
        expect(allSentCounter).toEqual(false);
        expect(allMailCounter).toEqual(false);
    });

    it('should not change unread counter for trash location', () => {
        const message = { Unread: 1, ConversationID: 'ConversationID' } as Message;
        const counters = [] as LabelCount[];
        const changes = { [MAILBOX_LABEL_IDS.TRASH]: true };
        const newCounters = updateCounters(message, counters, changes);
        const trashCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.TRASH);

        expect(trashCounter?.Total).toEqual(1);
        expect(trashCounter?.Unread).toEqual(0);
    });
});
