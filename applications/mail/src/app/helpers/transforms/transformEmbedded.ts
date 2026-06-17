import type {
    LoadEmbeddedResults,
    MessageEmbeddedImage,
    MessageState,
} from '@proton/mail/store/messages/messagesTypes';
import { couldPotentiallyBeRenderedAsSVG, isSupportedImage } from '@proton/shared/lib/helpers/mimetype';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { hasShowEmbedded } from '@proton/shared/lib/mail/images';
import { getAttachments, hasProtonSender, isDraft } from '@proton/shared/lib/mail/messages';
import generateUID from '@proton/utils/generateUID';

import {
    decryptEmbeddedImages,
    findEmbedded,
    matchSameCidOrLoc,
    readContentIDandLocation,
    setEmbeddedAttr,
} from 'proton-mail/helpers/message/messageEmbeddeds';
import { getEmbeddedImages, insertImageAnchor } from 'proton-mail/helpers/message/messageImages';

export const transformEmbedded = async (
    message: MessageState,
    mailSettings: MailSettings,
    onLoadEmbeddedImages: (attachments: Attachment[], isDraft?: boolean) => Promise<LoadEmbeddedResults>
) => {
    const draft = isDraft(message.data);

    const showEmbeddedImages =
        message.messageImages?.showEmbeddedImages === true ||
        hasShowEmbedded(mailSettings) ||
        hasProtonSender(message.data) ||
        draft;

    const existingEmbeddedImage = getEmbeddedImages(message);
    let newEmbeddedImages: MessageEmbeddedImage[] = [];

    if (message.messageDocument?.document) {
        const { document } = message.messageDocument;

        newEmbeddedImages = getAttachments(message.data)
            .map((attachment) => {
                const { cid, cloc } = readContentIDandLocation(attachment);

                const existing = existingEmbeddedImage.find((embeddedImage) =>
                    matchSameCidOrLoc(embeddedImage, cid, cloc)
                );

                if (existing) {
                    return [];
                }

                const matches = findEmbedded(cid, cloc, document);
                // NOTE: we remove inline images for SVG and any formats that are not common for security reasons.
                // Especially SVG is risky, since any script will run when loaded outside of an img tag.
                // CSP usually prevents inline scripts from loading, but if the initiator is not the current tab,
                // like when a blob url is copied and pasted in the url bar, the CSP policy is lost,
                // and scripts have access to the same origin without the CSP policy applied.
                // Drafts are kept as-is since they hold the user's own content.
                // Any attachments that are not used to display inline images will be shown in the attachment list to download.
                const mimeType = attachment.MIMEType || '';
                if (!draft && (couldPotentiallyBeRenderedAsSVG(mimeType) || !isSupportedImage(mimeType))) {
                    matches.forEach((match) => match.remove());
                    return [];
                }

                return matches.map((match) => {
                    const id = generateUID('embedded');
                    if (draft) {
                        setEmbeddedAttr(cid, cloc, match);
                    } else {
                        insertImageAnchor(id, 'embedded', match);
                    }
                    return {
                        type: 'embedded' as 'embedded',
                        original: match,
                        id,
                        cid,
                        cloc,
                        tracker: attachment.Headers?.['x-pm-tracker-provider'],
                        attachment,
                        status: 'not-loaded' as 'not-loaded',
                    };
                });
            })
            .flat();
    }

    let embeddedImages = [...existingEmbeddedImage, ...newEmbeddedImages];

    const hasEmbeddedImages = !!embeddedImages.length;

    if (showEmbeddedImages) {
        const { updatedImages } = decryptEmbeddedImages(embeddedImages, onLoadEmbeddedImages, draft);
        embeddedImages = updatedImages;
    }

    return {
        showEmbeddedImages: hasEmbeddedImages ? showEmbeddedImages : undefined,
        embeddedImages,
        hasEmbeddedImages,
    };
};
