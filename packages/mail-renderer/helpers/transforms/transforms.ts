import { transformAnchors } from '@proton/mail-renderer/helpers/transforms/transforAnchors';
import type {
    LoadEmbeddedResults,
    MessageImage,
    MessageRemoteImage,
    MessageState,
} from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { transformLinkify } from '@proton/shared/lib/mail/transformLinkify';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import type { Base64Cache } from 'proton-mail/hooks/useBase64Cache';

import { transformBase } from './transformBase';
import { transformEmbedded } from './transformEmbedded';
import { attachBase64, transformEscape } from './transformEscape';
import { transformLinks } from './transformLinks';
import { transformRemote } from './transformRemote';
import { transformStyleAttributes } from './transformStyleAttributes';
import { transformStylesheet } from './transformStylesheet';
import { transformWelcome } from './transformWelcome';

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
    mailSettings: MailSettings,
    onLoadEmbeddedImages: (attachments: Attachment[], isDraft?: boolean) => Promise<LoadEmbeddedResults>,
    onLoadRemoteImagesProxy: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadFakeImagesProxy: (imagesToLoad: MessageRemoteImage[], firstLoad?: boolean) => void,
    onLoadRemoteImagesDirect: (imagesToLoad: MessageRemoteImage[]) => void,
    onCleanUTMTrackers: (utmTrackers: MessageUTMTracker[]) => void
): Promise<Preparation> => {
    const document = transformEscape(message.decryption?.decryptedBody, base64Cache);

    transformBase(document);

    transformLinks(document, onCleanUTMTrackers, !!mailSettings.ImageProxy);

    transformAnchors(document);

    const { showEmbeddedImages, hasEmbeddedImages, embeddedImages } = await transformEmbedded(
        { ...message, messageDocument: { document } },
        mailSettings,
        onLoadEmbeddedImages
    );

    transformWelcome(document);

    transformStylesheet(document);

    transformStyleAttributes(document);

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

export const preparePlainText = async (
    body: string,
    isDraft: boolean,
    mailSettings: MailSettings = DEFAULT_MAILSETTINGS,
    onCleanUTMTrackers?: (utmTrackers: MessageUTMTracker[]) => void
): Promise<Preparation> => {
    const plainText = isDraft
        ? body
        : transformLinkify({ content: body, canCleanUTMTrackers: !!mailSettings.ImageProxy, onCleanUTMTrackers });

    return { plainText };
};
