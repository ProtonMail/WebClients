import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import { AttachmentsMetadata, Message } from '@proton/shared/lib/interfaces/mail/Message';

import {
    canShowAttachmentThumbnails,
    filterAttachmentToPreview,
    getOtherAttachmentsTitle,
} from 'proton-mail/helpers/attachment/attachmentThumbnails';
import { Conversation } from 'proton-mail/models/conversation';

const { SPAM, INBOX } = MAILBOX_LABEL_IDS;

const getConversation = (isSpam = false) => {
    return {
        AttachmentsMetadata: [
            { ID: '1' } as AttachmentsMetadata,
            { ID: '2' } as AttachmentsMetadata,
        ] as AttachmentsMetadata[],
        Labels: isSpam ? [{ ID: SPAM }] : [{ ID: INBOX }],
    } as Conversation;
};

const getMessage = (isSpam = false) => {
    return {
        AttachmentsMetadata: [
            { ID: '1' } as AttachmentsMetadata,
            { ID: '2' } as AttachmentsMetadata,
        ] as AttachmentsMetadata[],
        LabelIDs: isSpam ? [SPAM] : [INBOX],
        ConversationID: 'conversationID',
    } as Message;
};

const attachmentsMetadata = [{ ID: '1' } as AttachmentsMetadata];

describe('attachmentThumbnails', () => {
    describe('canShowAttachmentThumbnails', () => {
        it('should show attachment thumbnails', () => {
            expect(canShowAttachmentThumbnails(false, getConversation(), attachmentsMetadata, true)).toBeTruthy();
            expect(canShowAttachmentThumbnails(false, getMessage(), attachmentsMetadata, true)).toBeTruthy();
        });

        it('should not show attachment thumbnails when feature flag is off', () => {
            expect(canShowAttachmentThumbnails(false, getConversation(), attachmentsMetadata, false)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, getMessage(), attachmentsMetadata, false)).toBeFalsy();
        });

        it('should not show attachment thumbnails on compact view', () => {
            expect(canShowAttachmentThumbnails(true, getConversation(), attachmentsMetadata, true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(true, getMessage(), attachmentsMetadata, true)).toBeFalsy();
        });

        it('should not show attachment thumbnails when no attachment metadata is attached to the element', () => {
            expect(canShowAttachmentThumbnails(false, {} as Conversation, [], true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, {} as Message, [], true)).toBeFalsy();
        });

        it('should not show attachment thumbnails when element is in SPAM', () => {
            expect(canShowAttachmentThumbnails(false, getConversation(true), attachmentsMetadata, true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, getMessage(true), attachmentsMetadata, true)).toBeFalsy();
        });
    });

    describe('getOtherAttachmentsTitle', () => {
        const attachmentMetadata = [
            { ID: '1', Name: 'attachment1.png' } as AttachmentsMetadata,
            { ID: '2', Name: 'attachment2.jpg' } as AttachmentsMetadata,
            { ID: '3', Name: 'attachment3.pdf' } as AttachmentsMetadata,
            { ID: '4', Name: 'attachment4.txt' } as AttachmentsMetadata,
        ] as AttachmentsMetadata[];

        it('should return the expected title', () => {
            const res = getOtherAttachmentsTitle(attachmentMetadata, 2);

            expect(res).toEqual('attachment3.pdf, attachment4.txt');
        });
    });

    describe('filterAttachmentToPreview', () => {
        it('should filter attachments correctly', () => {
            const pdfAttachment = {
                MIMEType: 'application/pdf',
            } as AttachmentsMetadata;
            const imageAttachment = {
                MIMEType: 'image/png',
            } as AttachmentsMetadata;

            const attachmentsMetada: AttachmentsMetadata[] = [
                { MIMEType: MIME_TYPES.ICS } as AttachmentsMetadata,
                { MIMEType: MIME_TYPES.APPLICATION_ICS } as AttachmentsMetadata,
                { MIMEType: MIME_TYPES.PGP_KEYS } as AttachmentsMetadata,
                { MIMEType: 'whatever', Name: 'attachment.ics' } as AttachmentsMetadata,
                { MIMEType: 'whatever', Name: 'attachment.ical' } as AttachmentsMetadata,
                { MIMEType: 'whatever', Name: 'attachment.ifb' } as AttachmentsMetadata,
                { MIMEType: 'whatever', Name: 'attachment.icalendar' } as AttachmentsMetadata,
                { MIMEType: 'whatever', Name: 'attachment.asc' } as AttachmentsMetadata,
                pdfAttachment,
                imageAttachment,
            ];

            const expected: AttachmentsMetadata[] = [pdfAttachment, imageAttachment];

            expect(filterAttachmentToPreview(attachmentsMetada)).toEqual(expected);
        });
    });
});
