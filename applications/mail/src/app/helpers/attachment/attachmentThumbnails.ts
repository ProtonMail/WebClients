import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

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
