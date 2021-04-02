import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { updateCounters, updateCountersForMarkAs } from './counter';

describe('counters', () => {
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

    describe('updateCountersForMarkAs', () => {
        const LabelIDs = [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE];

        it('should update counters for read an unread message', () => {
            const before = { Unread: 1, ConversationID: 'ConversationID', LabelIDs } as Message;
            const after = { Unread: 0, ConversationID: 'ConversationID', LabelIDs } as Message;
            const counters = [
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 1, Unread: 1 },
                { LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Total: 1, Unread: 1 },
            ] as LabelCount[];
            const newCounters = updateCountersForMarkAs(before, after, counters);
            const inboxCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
            const archiveCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ARCHIVE);

            expect(inboxCounter?.Total).toEqual(1);
            expect(inboxCounter?.Unread).toEqual(0);
            expect(archiveCounter?.Total).toEqual(1);
            expect(archiveCounter?.Unread).toEqual(0);
        });

        it('should not update counters for read an read message', () => {
            const before = { Unread: 0, ConversationID: 'ConversationID', LabelIDs } as Message;
            const after = { Unread: 0, ConversationID: 'ConversationID', LabelIDs } as Message;
            const counters = [
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 1, Unread: 0 },
                { LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Total: 1, Unread: 0 },
            ] as LabelCount[];
            const newCounters = updateCountersForMarkAs(before, after, counters);
            const inboxCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
            const archiveCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ARCHIVE);

            expect(inboxCounter?.Total).toEqual(1);
            expect(inboxCounter?.Unread).toEqual(0);
            expect(archiveCounter?.Total).toEqual(1);
            expect(archiveCounter?.Unread).toEqual(0);
        });

        it('should update counters for unread an read message', () => {
            const before = { Unread: 0, ConversationID: 'ConversationID', LabelIDs } as Message;
            const after = { Unread: 1, ConversationID: 'ConversationID', LabelIDs } as Message;
            const counters = [
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 1, Unread: 0 },
                { LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Total: 1, Unread: 0 },
            ] as LabelCount[];
            const newCounters = updateCountersForMarkAs(before, after, counters);
            const inboxCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
            const archiveCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ARCHIVE);

            expect(inboxCounter?.Total).toEqual(1);
            expect(inboxCounter?.Unread).toEqual(1);
            expect(archiveCounter?.Total).toEqual(1);
            expect(archiveCounter?.Unread).toEqual(1);
        });

        it('should not update counters for unread an unread message', () => {
            const before = { Unread: 1, ConversationID: 'ConversationID', LabelIDs } as Message;
            const after = { Unread: 1, ConversationID: 'ConversationID', LabelIDs } as Message;
            const counters = [
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 1, Unread: 1 },
                { LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Total: 1, Unread: 1 },
            ] as LabelCount[];
            const newCounters = updateCountersForMarkAs(before, after, counters);
            const inboxCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
            const archiveCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ARCHIVE);

            expect(inboxCounter?.Total).toEqual(1);
            expect(inboxCounter?.Unread).toEqual(1);
            expect(archiveCounter?.Total).toEqual(1);
            expect(archiveCounter?.Unread).toEqual(1);
        });

        it('should not update counters where the message is not', () => {
            const before = { Unread: 1, ConversationID: 'ConversationID', LabelIDs: ['anyID'] } as Message;
            const after = { Unread: 0, ConversationID: 'ConversationID', LabelIDs: ['anyID'] } as Message;
            const counters = [
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 1, Unread: 1 },
                { LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Total: 1, Unread: 1 },
            ] as LabelCount[];
            const newCounters = updateCountersForMarkAs(before, after, counters);
            const inboxCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.INBOX);
            const archiveCounter = newCounters.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.ARCHIVE);

            expect(inboxCounter?.Total).toEqual(1);
            expect(inboxCounter?.Unread).toEqual(1);
            expect(archiveCounter?.Total).toEqual(1);
            expect(archiveCounter?.Unread).toEqual(1);
        });
    });
});
