import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import isTruthy from '@proton/utils/isTruthy';

import { hasLabel } from 'proton-mail/helpers/elements';
import { Element } from 'proton-mail/models/element';

const { SPAM } = MAILBOX_LABEL_IDS;

export const canShowAttachmentThumbnails = (
    isCompactView: boolean,
    element: Element,
    canSeeThumbnailsFeature?: boolean
) => {
    if (!!canSeeThumbnailsFeature) {
        // Do not show attachments for SPAM elements to protect the user
        const isSpam = hasLabel(element, SPAM);

        const hasAttachmentsMetadata = (element.AttachmentsMetadata?.length || 0) > 0;
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
