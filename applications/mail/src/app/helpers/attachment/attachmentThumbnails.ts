import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import type { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import isTruthy from '@proton/utils/isTruthy';

import { hasIcalExtension, hasKeyExtension } from 'proton-mail/helpers/attachment/attachment';
import { hasLabel } from 'proton-mail/helpers/elements';
import type { Element } from 'proton-mail/models/element';

const ATTACHMENT_THUMBNAILS_BLOCK_LIST: string[] = [MIME_TYPES.ICS, MIME_TYPES.APPLICATION_ICS, MIME_TYPES.PGP_KEYS];

export const canShowAttachmentThumbnails = (
    isCompactView: boolean,
    element: Element,
    attachmentMetadata: AttachmentsMetadata[]
) => {
    // Do not show attachments for SPAM elements to protect the user
    const isSpam = hasLabel(element, MAILBOX_LABEL_IDS.SPAM);

    const hasAttachmentsMetadata = attachmentMetadata.length > 0;
    return !isSpam && !isCompactView && hasAttachmentsMetadata;
};

export const getOtherAttachmentsTitle = (attachmentsMetadata: AttachmentsMetadata[], maxAttachment: number) => {
    return attachmentsMetadata
        .map((metadata, index) => {
            return index < maxAttachment ? '' : metadata.Name;
        })
        .filter(isTruthy)
        .join(', ');
};

export const filterAttachmentToPreview = (attachmentsMetadata: AttachmentsMetadata[]) => {
    // Check file MimeType to filter attachments
    // It's possible that the file has not the MimeType we want to exclude, so we make an additional check on the extension
    return attachmentsMetadata.filter(
        (attachmentMetadata) =>
            !ATTACHMENT_THUMBNAILS_BLOCK_LIST.includes(attachmentMetadata.MIMEType) &&
            !hasIcalExtension(attachmentMetadata.Name) &&
            !hasKeyExtension(attachmentMetadata.Name)
    );
};
