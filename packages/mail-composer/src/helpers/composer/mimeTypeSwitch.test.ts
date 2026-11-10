import type { MessageEmbeddedImage, MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { getEmbeddedAttachments, getSwitchToPlainTextChange } from './mimeTypeSwitch';

const logo = { ID: 'logo', Name: 'logo.png', Headers: { 'content-id': '<logo@example.com>' } } as Attachment;
const badge = { ID: 'badge', Name: 'badge.png', Headers: { 'content-location': 'badge.png' } } as Attachment;
const report = { ID: 'report', Name: 'report.pdf', Headers: {} } as Attachment;
const notShown = { ID: 'other', Name: 'other.png', Headers: { 'content-id': '<other@example.com>' } } as Attachment;

const embeddedImage = (attachment: Attachment, cid: string, cloc = ''): MessageEmbeddedImage => ({
    type: 'embedded',
    id: attachment.ID || '',
    cid,
    cloc,
    attachment,
    status: 'loaded',
    tracker: undefined,
});

const message = {
    localID: 'draft',
    data: { ID: 'draft', MIMEType: MIME_TYPES.DEFAULT, Attachments: [logo, badge, report, notShown] },
    messageImages: {
        hasEmbeddedImages: true,
        hasRemoteImages: false,
        showEmbeddedImages: true,
        showRemoteImages: false,
        trackersStatus: 'loaded',
        images: [
            // The draft's attachment IDs can differ from the ones the images were loaded with
            embeddedImage({ ...logo, ID: 'parent-logo' }, 'logo@example.com'),
            embeddedImage(badge, '', 'badge.png'),
        ],
    },
} as MessageState;

describe('mimeTypeSwitch', () => {
    describe('getEmbeddedAttachments', () => {
        it('should return the attachments of the embedded images, by CID or location', () => {
            expect(getEmbeddedAttachments(message)).toEqual([logo, badge]);
        });

        it('should return nothing without embedded images or attachments', () => {
            expect(getEmbeddedAttachments({ ...message, messageImages: undefined })).toEqual([]);
            expect(
                getEmbeddedAttachments({ ...message, data: { ...message.data, Attachments: [] } } as MessageState)
            ).toEqual([]);
            expect(getEmbeddedAttachments(undefined)).toEqual([]);
        });
    });

    describe('getSwitchToPlainTextChange', () => {
        it('should convert the content and remove the embedded images and their attachments', () => {
            const change = getSwitchToPlainTextChange(message, '<div>Hello</div><img src="blob:x">');

            expect(change.messageDocument?.plainText).toBe('Hello');
            expect(change.data?.MIMEType).toBe(MIME_TYPES.PLAINTEXT);
            expect(change.data?.Attachments).toEqual([report, notShown]);
            expect(change.messageImages?.images).toEqual([]);
        });

        it('should not set attachments when the draft has none', () => {
            const change = getSwitchToPlainTextChange({ localID: 'draft', data: {} } as MessageState, 'Hello');

            expect(change.data).toEqual({ MIMEType: MIME_TYPES.PLAINTEXT });
        });
    });
});
