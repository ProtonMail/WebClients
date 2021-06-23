import generateUID from 'proton-shared/lib/helpers/generateUID';
import { Api, MailSettings } from 'proton-shared/lib/interfaces';
import { getAttachments, isDraft } from 'proton-shared/lib/mail/messages';
import { MessageEmbeddedImage, MessageExtended, MessageKeys } from '../../models/message';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MessageCache } from '../../containers/MessageProvider';
import { hasShowEmbedded } from '../mailSettings';
import { getEmbeddedImages, insertImageAnchor } from '../message/messageImages';
import { findEmbedded, readCID, decryptEmbeddedImages } from '../message/messageEmbeddeds';

export const transformEmbedded = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    messageCache: MessageCache,
    attachmentsCache: AttachmentsCache,
    api: Api,
    mailSettings: MailSettings | undefined
) => {
    const draft = isDraft(message.data);

    const showEmbeddedImages =
        message.messageImages?.showEmbeddedImages === true || hasShowEmbedded(mailSettings) || draft;

    let newEmbeddedImages: MessageEmbeddedImage[] = [];

    if (message.document) {
        newEmbeddedImages = getAttachments(message.data)
            .map((attachment) => {
                const cid = readCID(attachment);
                const matches = findEmbedded(cid, message.document as Element);
                return matches.map((match) => {
                    const id = generateUID('embedded');
                    if (!draft) {
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

    let embeddedImages = [...getEmbeddedImages(message), ...newEmbeddedImages];

    const hasEmbeddedImages = !!embeddedImages.length;

    if (showEmbeddedImages) {
        embeddedImages = decryptEmbeddedImages(
            embeddedImages,
            message.localID,
            message.verification,
            messageKeys,
            messageCache,
            attachmentsCache,
            api
        );
    }

    return {
        showEmbeddedImages: hasEmbeddedImages ? showEmbeddedImages : undefined,
        embeddedImages,
        hasEmbeddedImages,
    };
};
