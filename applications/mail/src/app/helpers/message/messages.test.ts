import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getRecipients, getSender } from 'proton-shared/lib/mail/messages';
import { getMessagesAuthorizedToMove } from './messages';

const { INBOX, TRASH, SENT } = MAILBOX_LABEL_IDS;

describe('message', () => {
    describe('getSender', () => {
        it('should return Sender', () => {
            const message = { Sender: { Name: 'Name', Address: 'Address' } } as Message;
            expect(getSender(message)).toBe(message.Sender);
        });
    });

    describe('getRecipients', () => {
        it('should return Name over Address', () => {
            const message = { ToList: [{ Name: 'Name', Address: 'Address' }] } as Message;
            expect(getRecipients(message)).toEqual([message.ToList[0]]);
        });

        it('should return recipients from all kinds', () => {
            const message = {
                ToList: [{ Name: 'Name1' }],
                CCList: [{ Address: 'Address2' }],
                BCCList: [{ Name: 'Name3' }],
            } as Message;
            expect(getRecipients(message)).toEqual([message.ToList[0], message.CCList[0], message.BCCList[0]]);
        });
    });

    describe('getMessagesAuthorizedToMove', () => {
        it('should filter out messages from Drafts, All Drafts, Sent and All Sent if destination folder is Spam or Inbox', () => {
            const message1 = { ID: '0', LabelIDs: [TRASH] } as Message;
            const message2 = { ID: '1', LabelIDs: [SENT] } as Message;
            expect(getMessagesAuthorizedToMove([message1, message2], INBOX)).toEqual([message1]);
        });
    });
});
