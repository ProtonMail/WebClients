import { MailSettings } from '@proton/shared/lib/interfaces';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { transformEscape, attachBase64 } from './transformEscape';
import { Base64Cache } from '../../hooks/useBase64Cache';
import { transformBase } from './transformBase';
import { transformLinks } from './transformLinks';
import { transformEmbedded } from './transformEmbedded';
import { transformWelcome } from './transformWelcome';
import { transformStylesheet } from './transformStylesheet';
import { transformRemote } from './transformRemote';
import { transformLinkify } from './transformLinkify';
import {
    LoadEmbeddedResults,
    MessageImage,
    MessageRemoteImage,
    MessageState,
} from '../../logic/messages/messagesTypes';

export interface Preparation {
    plainText?: string;
    document?: Element;
    showEmbeddedImages?: boolean;
    showRemoteImages?: boolean;
    hasRemoteImages?: boolean;
    hasEmbeddedImages?: boolean;
    remoteImages?: MessageImage[];
    embeddedImages?: MessageImage[];
}

export const prepareHtml = async (
    message: MessageState,
    base64Cache: Base64Cache,
    mailSettings: MailSettings | undefined,
    onLoadEmbeddedImages: (attachments: Attachment[]) => Promise<LoadEmbeddedResults>,
    onLoadRemoteImagesProxy: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadFakeImagesProxy: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadRemoteImagesDirect: (imagesToLoad: MessageRemoteImage[]) => void
): Promise<Preparation> => {
    const document = transformEscape(message.decryption?.decryptedBody, base64Cache);

    transformBase(document);

    transformLinks(document);

    const { showEmbeddedImages, hasEmbeddedImages, embeddedImages } = await transformEmbedded(
        { ...message, messageDocument: { document } },
        mailSettings,
        onLoadEmbeddedImages
    );

    transformWelcome(document);

    transformStylesheet(document);

    const { showRemoteImages, hasRemoteImages, remoteImages } = transformRemote(
        { ...message, messageDocument: { document } },
        mailSettings,
        onLoadRemoteImagesDirect,
        onLoadRemoteImagesProxy,
        onLoadFakeImagesProxy
    );

    attachBase64(document, base64Cache);

    return {
        document,
        showRemoteImages,
        showEmbeddedImages,
        hasRemoteImages,
        remoteImages,
        hasEmbeddedImages,
        embeddedImages,
    };
};

export const preparePlainText = async (body: string, isDraft: boolean): Promise<Preparation> => {
    const plainText = isDraft ? body : transformLinkify(body);

    return { plainText };
};
