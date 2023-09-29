import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { AttachmentsMetadata, Message } from '@proton/shared/lib/interfaces/mail/Message';

import {
    canShowAttachmentThumbnails,
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

describe('attachmentThumbnails', () => {
    describe('canShowAttachmentThumbnails', () => {
        it('should show attachment thumbnails', () => {
            expect(canShowAttachmentThumbnails(false, getConversation(), true)).toBeTruthy();
            expect(canShowAttachmentThumbnails(false, getMessage(), true)).toBeTruthy();
        });

        it('should not show attachment thumbnails when feature flag is off', () => {
            expect(canShowAttachmentThumbnails(false, getConversation(), false)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, getMessage(), false)).toBeFalsy();
        });

        it('should not show attachment thumbnails on compact view', () => {
            expect(canShowAttachmentThumbnails(true, getConversation(), true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(true, getMessage(), true)).toBeFalsy();
        });

        it('should not show attachment thumbnails when no attachment metadata is attached to the element', () => {
            expect(canShowAttachmentThumbnails(false, {} as Conversation, true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, {} as Message, true)).toBeFalsy();
        });

        it('should not show attachment thumbnails when element is in SPAM', () => {
            expect(canShowAttachmentThumbnails(false, getConversation(true), true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, getMessage(true), true)).toBeFalsy();
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
});
