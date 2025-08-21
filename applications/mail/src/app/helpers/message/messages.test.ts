import type { MessageImage, MessageImages } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients, getSender } from '@proton/shared/lib/mail/messages';

import { getAttachmentCounts, getMessagesAuthorizedToMove } from './messages';

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
        const inboxMessage = { ID: '0', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Flags: 1 } as Message;
        const sentMessage = { ID: '1', LabelIDs: [MAILBOX_LABEL_IDS.SENT], Flags: 2 } as Message;
        const draftMessage = { ID: '2', LabelIDs: [MAILBOX_LABEL_IDS.DRAFTS], Flags: 0 } as Message;

        it('should return messages authorized to move', () => {
            expect(
                getMessagesAuthorizedToMove([inboxMessage, sentMessage, draftMessage], MAILBOX_LABEL_IDS.INBOX)
            ).toEqual([inboxMessage]);
            expect(
                getMessagesAuthorizedToMove([inboxMessage, sentMessage, draftMessage], MAILBOX_LABEL_IDS.SENT)
            ).toEqual([sentMessage]);
            expect(
                getMessagesAuthorizedToMove([inboxMessage, sentMessage, draftMessage], MAILBOX_LABEL_IDS.DRAFTS)
            ).toEqual([draftMessage]);
        });

        it('should move all to trash', () => {
            expect(
                getMessagesAuthorizedToMove([inboxMessage, sentMessage, draftMessage], MAILBOX_LABEL_IDS.TRASH)
            ).toEqual([inboxMessage, sentMessage, draftMessage]);
        });

        it('should authorize move to Inbox when message is sent to himself', () => {
            const message = { ID: '0', LabelIDs: [MAILBOX_LABEL_IDS.SENT], Flags: 3 } as Message;
            expect(getMessagesAuthorizedToMove([message], MAILBOX_LABEL_IDS.INBOX)).toEqual([message]);
        });

        it('should not move Sent and Draft messages to Spam', () => {
            expect(
                getMessagesAuthorizedToMove([inboxMessage, sentMessage, draftMessage], MAILBOX_LABEL_IDS.SPAM)
            ).toEqual([inboxMessage]);
        });
    });

    describe('getAttachmentCounts', () => {
        const attachment1 = { ID: '0' };
        const attachment2 = { ID: '1' };
        const attachment3 = { ID: '2' };
        const messageImage1 = { type: 'embedded', attachment: attachment1 };
        const messageImage2 = { type: 'embedded', attachment: attachment2 };
        const messageImage3 = { type: 'embedded', attachment: attachment2 }; // image 3 use attachment 2
        const messageImage4 = { type: 'embedded', attachment: attachment2 }; // image 4 use attachment 2

        it('should count only pure attachments', () => {
            const { pureAttachmentsCount, embeddedAttachmentsCount, attachmentsCount } = getAttachmentCounts(
                [attachment1],
                { images: [] as MessageImage[] } as MessageImages
            );
            expect(pureAttachmentsCount).toBe(1);
            expect(embeddedAttachmentsCount).toBe(0);
            expect(attachmentsCount).toBe(1);
        });
        it('should count only embedded images', () => {
            const { pureAttachmentsCount, embeddedAttachmentsCount, attachmentsCount } = getAttachmentCounts(
                [attachment1],
                { images: [messageImage1] } as MessageImages
            );
            expect(pureAttachmentsCount).toBe(0);
            expect(embeddedAttachmentsCount).toBe(1);
            expect(attachmentsCount).toBe(1);
        });
        it('should count mixed attachments', () => {
            const { pureAttachmentsCount, embeddedAttachmentsCount, attachmentsCount } = getAttachmentCounts(
                [attachment1, attachment2, attachment3],
                { images: [messageImage1, messageImage2] } as MessageImages
            );
            expect(pureAttachmentsCount).toBe(1);
            expect(embeddedAttachmentsCount).toBe(2);
            expect(attachmentsCount).toBe(3);
        });
        it('should deal with single attachment used for several embeddeds', () => {
            const { pureAttachmentsCount, embeddedAttachmentsCount, attachmentsCount } = getAttachmentCounts(
                [attachment1, attachment2, attachment3],
                { images: [messageImage1, messageImage2, messageImage3, messageImage4] } as MessageImages
            );
            expect(pureAttachmentsCount).toBe(1);
            expect(embeddedAttachmentsCount).toBe(2);
            expect(attachmentsCount).toBe(3);
        });
    });
});
