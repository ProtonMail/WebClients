import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import type { AttachmentsMetadata, Message } from '@proton/shared/lib/interfaces/mail/Message';

import {
    canShowAttachmentThumbnails,
    filterAttachmentToPreview,
    getOtherAttachmentsTitle,
} from 'proton-mail/helpers/attachment/attachmentThumbnails';
import type { Conversation } from 'proton-mail/models/conversation';

const getConversation = (isSpam = false) => {
    return {
        AttachmentsMetadata: [
            { ID: '1' } as AttachmentsMetadata,
            { ID: '2' } as AttachmentsMetadata,
        ] as AttachmentsMetadata[],
        Labels: isSpam ? [{ ID: MAILBOX_LABEL_IDS.SPAM }] : [{ ID: MAILBOX_LABEL_IDS.INBOX }],
    } as Conversation;
};

const getMessage = (isSpam = false) => {
    return {
        AttachmentsMetadata: [
            { ID: '1' } as AttachmentsMetadata,
            { ID: '2' } as AttachmentsMetadata,
        ] as AttachmentsMetadata[],
        LabelIDs: isSpam ? [MAILBOX_LABEL_IDS.SPAM] : [MAILBOX_LABEL_IDS.INBOX],
        ConversationID: 'conversationID',
    } as Message;
};

const attachmentsMetadata = [{ ID: '1' } as AttachmentsMetadata];

describe('attachmentThumbnails', () => {
    describe('canShowAttachmentThumbnails', () => {
        it('should show attachment thumbnails', () => {
            expect(canShowAttachmentThumbnails(false, getConversation(), attachmentsMetadata)).toBeTruthy();
            expect(canShowAttachmentThumbnails(false, getMessage(), attachmentsMetadata)).toBeTruthy();
        });

        it('should not show attachment thumbnails on compact view', () => {
            expect(canShowAttachmentThumbnails(true, getConversation(), attachmentsMetadata)).toBeFalsy();
            expect(canShowAttachmentThumbnails(true, getMessage(), attachmentsMetadata)).toBeFalsy();
        });

        it('should not show attachment thumbnails when no attachment metadata is attached to the element', () => {
            expect(canShowAttachmentThumbnails(false, {} as Conversation, [])).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, {} as Message, [])).toBeFalsy();
        });

        it('should not show attachment thumbnails when element is in MAILBOX_LABEL_IDS.SPAM', () => {
            expect(canShowAttachmentThumbnails(false, getConversation(true), attachmentsMetadata)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, getMessage(true), attachmentsMetadata)).toBeFalsy();
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
