import type { DecryptedAttachment } from '@proton/mail-message/store/attachments/attachmentsTypes';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import type { MailState } from '../../../store/store';
import { getInlineImagesToRestore, getRemovedInlineImageData } from './editorWrapperHelpers';

const decryptedAttachment = (cid: string, cloc = ''): DecryptedAttachment => ({
    data: new Uint8Array([1, 2, 3]),
    filename: `${cid || 'empty'}.png`,
    signatures: [],
    verificationStatus: MAIL_VERIFICATION_STATUS.NOT_SIGNED,
    type: 'image/png',
    cid,
    cloc,
});

const cid = 'image@example.com';
const parentID = 'ParentMessageID';
const draftAttachment = { ID: 'DraftAttachmentID', Headers: { 'content-id': cid } } as Attachment;
const parentAttachment = { ID: 'ParentAttachmentID', Headers: { 'content-id': cid } } as Attachment;
const draft = { localID: 'DraftLocalID', draftFlags: { ParentID: parentID } } as MessageState;

const getState = (attachments: MailState['attachments'], parentAttachments: Attachment[] = [parentAttachment]) =>
    ({
        attachments,
        messages: { [parentID]: { localID: parentID, data: { ID: parentID, Attachments: parentAttachments } } },
    }) as unknown as MailState;

describe('editorWrapperHelpers', () => {
    describe('getRemovedInlineImageData', () => {
        it('should return the data stored under the removed attachment ID', () => {
            const ownImage = decryptedAttachment('');
            const state = getState({ OtherID: decryptedAttachment(cid), DraftAttachmentID: ownImage });

            expect(getRemovedInlineImageData(state, draft, draftAttachment, cid)).toBe(ownImage);
        });

        it("should fall back on the parent message's attachment with the same CID", () => {
            const parentImage = decryptedAttachment(cid);
            const state = getState({ ParentAttachmentID: parentImage });

            expect(getRemovedInlineImageData(state, draft, draftAttachment, cid)).toBe(parentImage);
        });

        it('should not return attachments of other messages sharing the CID', () => {
            const state = getState({ OtherMessageAttachmentID: decryptedAttachment(cid) });

            expect(getRemovedInlineImageData(state, draft, draftAttachment, cid)).toBeUndefined();
        });

        it('should not return data when the parent message has no attachment with the CID', () => {
            const state = getState({ ParentAttachmentID: decryptedAttachment(cid) }, [
                { ID: 'ParentAttachmentID', Headers: { 'content-id': 'other@example.com' } } as Attachment,
            ]);

            expect(getRemovedInlineImageData(state, draft, draftAttachment, cid)).toBeUndefined();
        });

        it('should not fall back when the draft has no parent', () => {
            const state = getState({ ParentAttachmentID: decryptedAttachment(cid) });

            expect(
                getRemovedInlineImageData(state, { localID: 'DraftLocalID' } as MessageState, draftAttachment, cid)
            ).toBeUndefined();
        });

        it('should ignore empty CIDs', () => {
            const state = getState({ DraftAttachmentID: decryptedAttachment('', '') });

            expect(getRemovedInlineImageData(state, draft, draftAttachment, '')).toBeUndefined();
        });
    });

    describe('getInlineImagesToRestore', () => {
        const removedImage = decryptedAttachment(cid);

        const getImagesToRestore = (
            missedCIDs: string[],
            {
                attachedCIDs = [],
                reuploadingCIDs = new Set<string>(),
                removedInlineImages = new Map([[cid, removedImage]]),
            }: {
                attachedCIDs?: string[];
                reuploadingCIDs?: Set<string>;
                removedInlineImages?: Map<string, DecryptedAttachment>;
            } = {}
        ) => getInlineImagesToRestore({ missedCIDs, attachedCIDs, reuploadingCIDs, removedInlineImages });

        it('should restore an inline image previously removed by the composer', () => {
            expect(getImagesToRestore([cid])).toEqual([{ cid, attachment: removedImage }]);
        });

        it('should ignore CIDs that were not removed by the composer', () => {
            expect(getImagesToRestore(['victim@example.com', '', 'image'])).toEqual([]);
        });

        it('should ignore empty CIDs', () => {
            expect(getImagesToRestore([''], { removedInlineImages: new Map([['', removedImage]]) })).toEqual([]);
        });

        it('should ignore images already attached or being re-uploaded', () => {
            expect(getImagesToRestore([cid], { attachedCIDs: [cid] })).toEqual([]);
            expect(getImagesToRestore([cid], { reuploadingCIDs: new Set([cid]) })).toEqual([]);
        });
    });
});
