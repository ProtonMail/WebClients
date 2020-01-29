import { findMessageToExpand } from './messageExpandable';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { MESSAGE_FLAGS } from '../../constants';

describe('messageExpandable', () => {
    it('should return last message if not a custom label and all are reads', () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const messages = [
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 }
        ];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[2]);
    });

    it('should return last unread message if not a custom label and all are not reads', () => {
        const labelID = MAILBOX_LABEL_IDS.INBOX;
        const messages = [
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 1 },
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 1 }
        ];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last unread message if in starred label', () => {
        const labelID = MAILBOX_LABEL_IDS.STARRED;
        const messages = [
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 },
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 }
        ];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last unread message if in starred label', () => {
        const labelID = 'my custom label';
        const messages = [
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, Unread: 0 },
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 },
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED, LabelIDs: [labelID], Unread: 1 }
        ];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return last message if in draft label', () => {
        const labelID = MAILBOX_LABEL_IDS.DRAFTS;
        const messages = [
            { Flags: MESSAGE_FLAGS.FLAG_REPLIED }, // draft
            { Flags: MESSAGE_FLAGS.FLAG_REPLIED }, // draft
            { Flags: MESSAGE_FLAGS.FLAG_RECEIVED } // not draft
        ];
        expect(findMessageToExpand(labelID, messages)).toBe(messages[1]);
    });

    it('should return empty for a conversation with only a draft', () => {
        const labelID = 'custom';
        const messages = [{ Flags: MESSAGE_FLAGS.FLAG_REPLIED }];
        expect(findMessageToExpand(labelID, messages)).toEqual({});
    });
});
