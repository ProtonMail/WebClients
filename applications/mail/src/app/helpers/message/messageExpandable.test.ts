import { MESSAGE_FLAGS } from '../../constants';
import { findMessageToExpand } from './messageExpandable';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { Message } from '../../models/message';

describe('messageExpandable', () => {
    it('should return last message if not a custom label and all are reads', () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const messages = [
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 }
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[2]);
    });

    it('should return last unread message if not a custom label and all are not reads', () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const messages = [
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 1 },
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 1 }
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last unread message if in starred label', () => {
        const labelID = MAILBOX_LABEL_IDS.STARRED;
        const messages = [
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 },
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 }
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last unread message if in starred label', () => {
        const labelID = 'my custom label';
        const messages = [
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 },
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 }
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last message if in draft label', () => {
        const labelID = MAILBOX_LABEL_IDS.DRAFTS;
        const messages = [
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_REPLIED }, // draft
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_REPLIED }, // draft
            { ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_RECEIVED } // not draft
        ] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return empty for a conversation with only a draft', () => {
        const labelID = 'custom';
        const messages = [{ ConversationID: '', Flags: MESSAGE_FLAGS.FLAG_REPLIED }] as Message[];
        expect(findMessageToExpand(labelID, messages)).toBeUndefined();
    });
});
