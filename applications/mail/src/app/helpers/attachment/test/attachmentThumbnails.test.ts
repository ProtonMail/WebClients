import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { AttachmentsMetadata, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { canShowAttachmentThumbnails } from 'proton-mail/helpers/attachment/attachmentThumbnails';
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
            expect(canShowAttachmentThumbnails(false, true, getConversation(), true)).toBeTruthy();
            expect(canShowAttachmentThumbnails(false, true, getMessage(), true)).toBeTruthy();
        });

        it('should not show attachment thumbnails when feature flag is off', () => {
            expect(canShowAttachmentThumbnails(false, true, getConversation(), false)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, true, getMessage(), false)).toBeFalsy();
        });

        it('should not show attachment thumbnails on compact view', () => {
            expect(canShowAttachmentThumbnails(true, true, getConversation(), true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(true, true, getMessage(), true)).toBeFalsy();
        });

        it('should not show attachment thumbnails when no attachment metadata is attached to the element', () => {
            expect(canShowAttachmentThumbnails(false, true, {} as Conversation, true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, true, {} as Message, true)).toBeFalsy();
        });

        it('should not show attachment thumbnails when element is in SPAM', () => {
            expect(canShowAttachmentThumbnails(false, true, getConversation(true), true)).toBeFalsy();
            expect(canShowAttachmentThumbnails(false, true, getMessage(true), true)).toBeFalsy();
        });
    });
});
