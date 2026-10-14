import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments } from '@proton/shared/lib/mail/messages';

import { readContentIDandLocation } from '../../../helpers/message/messageEmbeddeds';
import { attachmentByID } from '../../../store/attachments/attachmentsSelectors';
import type { DecryptedAttachment } from '../../../store/attachments/attachmentsTypes';
import { messageByID } from '../../../store/messages/messagesSelectors';
import type { MailState } from '../../../store/store';

export const getAttachedCIDs = (message: MessageState) => {
    if (!message.data?.Attachments) {
        return [];
    }

    return message.data.Attachments.map((attachment) => readContentIDandLocation(attachment).cid);
};

/**
 * Decrypted data of an inline image the composer is removing from the draft, kept so that undo can re-upload it.
 * The attachments store is shared by every message and CIDs are not unique across messages,
 * so the data is only ever looked up by attachment ID.
 */
export const getRemovedInlineImageData = (
    state: MailState,
    message: MessageState,
    attachment: Attachment,
    cid: string
): DecryptedAttachment | undefined => {
    if (!cid) {
        return undefined;
    }

    const draftAttachmentData = attachment.ID ? attachmentByID(state, { ID: attachment.ID }) : undefined;
    if (draftAttachmentData) {
        return draftAttachmentData;
    }

    // Reply and forward drafts get new attachment IDs on save, the data may only be stored under the parent's attachment
    const parentID = message.draftFlags?.ParentID;
    if (!parentID) {
        return undefined;
    }

    const parentAttachment = getAttachments(messageByID(state, { ID: parentID })?.data).find(
        (parentAttachment) => readContentIDandLocation(parentAttachment).cid === cid
    );

    return parentAttachment?.ID ? attachmentByID(state, { ID: parentAttachment.ID }) : undefined;
};

/**
 * Only inline images previously removed by this composer can be restored.
 * CIDs found in the editor content are attacker-controllable (e.g. quoted messages) and must not select data on their own.
 */
export const getInlineImagesToRestore = ({
    missedCIDs,
    attachedCIDs,
    reuploadingCIDs,
    removedInlineImages,
}: {
    missedCIDs: string[];
    attachedCIDs: string[];
    reuploadingCIDs: Set<string>;
    removedInlineImages: Map<string, DecryptedAttachment>;
}) =>
    missedCIDs.flatMap((cid) => {
        const attachment = removedInlineImages.get(cid);

        if (!cid || !attachment || attachedCIDs.includes(cid) || reuploadingCIDs.has(cid)) {
            return [];
        }

        return [{ cid, attachment }];
    });
