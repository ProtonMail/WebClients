import generateUID from '@proton/atoms/generateUID';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { hasShowEmbedded } from '@proton/shared/lib/mail/images';
import { getAttachments, hasProtonSender, isDraft } from '@proton/shared/lib/mail/messages';

import type { LoadEmbeddedResults, MessageEmbeddedImage, MessageState } from '../../store/messages/messagesTypes';
import {
    decryptEmbeddedImages,
    findEmbedded,
    insertBlobImages,
    markEmbeddedImagesAsLoaded,
    matchSameCidOrLoc,
    readContentIDandLocation,
    setEmbeddedAttr,
} from '../message/messageEmbeddeds';
import { getEmbeddedImages, insertImageAnchor } from '../message/messageImages';

export const transformEmbedded = async (
    message: MessageState,
    mailSettings: MailSettings,
    onLoadEmbeddedImages: (attachments: Attachment[]) => Promise<LoadEmbeddedResults>
) => {
    const draft = isDraft(message.data);

    const showEmbeddedImages =
        message.messageImages?.showEmbeddedImages === true ||
        hasShowEmbedded(mailSettings) ||
        hasProtonSender(message.data);

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
        const { updatedImages, downloadPromise } = decryptEmbeddedImages(embeddedImages, onLoadEmbeddedImages);
        embeddedImages = updatedImages;

        // In draft, we actually want image in the document
        if (draft) {
            const downloadResults = await downloadPromise;
            embeddedImages = markEmbeddedImagesAsLoaded(embeddedImages, downloadResults);
            if (message.messageDocument?.document) {
                insertBlobImages(message.messageDocument.document, embeddedImages);
            }
        }
    }

    return {
        showEmbeddedImages: hasEmbeddedImages ? showEmbeddedImages : undefined,
        embeddedImages,
        hasEmbeddedImages,
    };
};
