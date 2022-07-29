import generateUID from '@proton/shared/lib/helpers/generateUID';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments, isDraft } from '@proton/shared/lib/mail/messages';

import { WHITE_LISTED_ADDRESSES } from '../../constants';
import { LoadEmbeddedResults, MessageEmbeddedImage, MessageState } from '../../logic/messages/messagesTypes';
import { hasShowEmbedded } from '../mailSettings';
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
    mailSettings: MailSettings | undefined,
    onLoadEmbeddedImages: (attachments: Attachment[]) => Promise<LoadEmbeddedResults>
) => {
    const draft = isDraft(message.data);

    const showEmbeddedImages =
        message.messageImages?.showEmbeddedImages === true ||
        hasShowEmbedded(mailSettings) ||
        WHITE_LISTED_ADDRESSES.includes(message.data?.Sender?.Address || '');

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
