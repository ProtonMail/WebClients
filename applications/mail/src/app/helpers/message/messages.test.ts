import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients, getSender } from '@proton/shared/lib/mail/messages';
import { MessageImage, MessageImages } from '../../models/message';
import { getAttachmentCounts, getMessagesAuthorizedToMove } from './messages';

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
