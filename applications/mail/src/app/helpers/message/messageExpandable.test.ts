import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from 'proton-shared/lib/mail/constants';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { findMessageToExpand } from './messageExpandable';

describe('messageExpandable', () => {
    it('should return last message if not a custom label and all are reads', () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const messages = [
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[2]);
    });

    it('should return last unread message if not a custom label and all are not reads', () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const messages = [
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 1 },
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 1 },
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last unread message if in starred label', () => {
        const labelID = MAILBOX_LABEL_IDS.STARRED;
        const messages = [
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 },
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 },
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last unread message if in starred label', () => {
        const labelID = 'my custom label';
        const messages = [
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 },
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 },
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last message if in draft label', () => {
        const labelID = MAILBOX_LABEL_IDS.DRAFTS;
        const messages = [
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_REPLIED }, // draft
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_REPLIED }, // draft
            { ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED }, // not draft
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return empty for a conversation with only a draft', () => {
        const labelID = 'custom';
        const messages = [{ ID: '', ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_REPLIED }] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBeUndefined();
    });
});
