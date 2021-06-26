import generateUID from '@proton/shared/lib/helpers/generateUID';
import { Api, MailSettings } from '@proton/shared/lib/interfaces';
import { getAttachments, isDraft } from '@proton/shared/lib/mail/messages';
import { MessageEmbeddedImage, MessageExtended, MessageKeys } from '../../models/message';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MessageCache } from '../../containers/MessageProvider';
import { hasShowEmbedded } from '../mailSettings';
import { getEmbeddedImages, insertImageAnchor } from '../message/messageImages';
import {
    findEmbedded,
    readCID,
    decryptEmbeddedImages,
    markEmbeddedImagesAsLoaded,
    insertBlobImages,
} from '../message/messageEmbeddeds';

export const transformEmbedded = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    messageCache: MessageCache,
    attachmentsCache: AttachmentsCache,
    api: Api,
    mailSettings: MailSettings | undefined
) => {
    const draft = isDraft(message.data);

    const showEmbeddedImages = message.messageImages?.showEmbeddedImages === true || hasShowEmbedded(mailSettings);

    const existingEmbeddedImage = getEmbeddedImages(message);
    let newEmbeddedImages: MessageEmbeddedImage[] = [];

    if (message.document) {
        newEmbeddedImages = getAttachments(message.data)
            .map((attachment) => {
                const cid = readCID(attachment);

                const existing = existingEmbeddedImage.find((embeddedImage) => embeddedImage.cid === cid);

                if (existing) {
                    return [];
                }

                const matches = findEmbedded(cid, message.document as Element);

                return matches.map((match) => {
                    const id = generateUID('embedded');
                    if (draft) {
                        match.setAttribute('data-embedded-img', cid);
                    } else {
                        insertImageAnchor(id, 'embedded', match);
                    }
                    return {
                        type: 'embedded' as 'embedded',
                        original: match,
                        id,
                        cid,
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
        const { updatedImages, downloadPromise } = decryptEmbeddedImages(
            embeddedImages,
            message.localID,
            message.verification,
            messageKeys,
            messageCache,
            attachmentsCache,
            api
        );
        embeddedImages = updatedImages;

        // In draft, we actually want image in the document
        if (draft) {
            const downloadResults = await downloadPromise;
            embeddedImages = markEmbeddedImagesAsLoaded(embeddedImages, downloadResults);
            if (message.document) {
                insertBlobImages(message.document, embeddedImages);
            }
        }
    }

    return {
        showEmbeddedImages: hasEmbeddedImages ? showEmbeddedImages : undefined,
        embeddedImages,
        hasEmbeddedImages,
    };
};
