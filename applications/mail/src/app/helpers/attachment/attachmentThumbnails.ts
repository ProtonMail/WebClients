import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import isTruthy from '@proton/utils/isTruthy';

import { hasLabel } from 'proton-mail/helpers/elements';
import { Element } from 'proton-mail/models/element';

const { SPAM } = MAILBOX_LABEL_IDS;

const ATTACHMENT_THUMBNAILS_BLOCK_LIST: string[] = [MIME_TYPES.ICS, MIME_TYPES.APPLICATION_ICS, MIME_TYPES.PGP_KEYS];

export const canShowAttachmentThumbnails = (
    isCompactView: boolean,
    element: Element,
    attachmentMetadata: AttachmentsMetadata[],
    canSeeThumbnailsFeature?: boolean
) => {
    if (!!canSeeThumbnailsFeature) {
        // Do not show attachments for SPAM elements to protect the user
        const isSpam = hasLabel(element, SPAM);

        const hasAttachmentsMetadata = attachmentMetadata.length > 0;
        return !isSpam && !isCompactView && hasAttachmentsMetadata;
    }

    return false;
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
    return attachmentsMetadata.filter(
        (attachmentMetadata) => !ATTACHMENT_THUMBNAILS_BLOCK_LIST.includes(attachmentMetadata.MIMEType)
    );
};
