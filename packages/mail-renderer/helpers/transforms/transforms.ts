import { transformAnchors } from '@proton/mail-renderer/helpers/transforms/transformAnchors';
import type { Base64Cache } from '@proton/mail/hooks/useBase64Cache';
import type {
    MessageEmbeddedImage,
    MessageImage,
    MessageRemoteImage,
    MessageState,
} from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { transformLinkify } from '@proton/shared/lib/mail/transformLinkify';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import { transformBase } from './transformBase';
import { attachBase64, transformEscape } from './transformEscape';
import { transformLinks } from './transformLinks';
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
    handleTransformAndLoadEmbeddedImages: (document: Element) => Promise<{
        showEmbeddedImages: boolean | undefined;
        embeddedImages: MessageEmbeddedImage[];
        hasEmbeddedImages: boolean;
    }>,
    handleTransformAndLoadRemoteImages: (document: Element) => {
        document: Document;
        showRemoteImages: boolean | undefined;
        remoteImages: MessageRemoteImage[];
        hasRemoteImages: boolean;
    },
    onCleanUTMTrackers: (utmTrackers: MessageUTMTracker[]) => void
): Promise<Preparation> => {
    const document = transformEscape(message.decryption?.decryptedBody, base64Cache);

    transformBase(document);

    transformLinks(document, onCleanUTMTrackers, !!mailSettings.ImageProxy);

    transformAnchors(document);

    const { showEmbeddedImages, hasEmbeddedImages, embeddedImages } =
        await handleTransformAndLoadEmbeddedImages(document);

    transformWelcome(document);

    transformStylesheet(document);

    transformStyleAttributes(document);

    const { showRemoteImages, hasRemoteImages, remoteImages } = handleTransformAndLoadRemoteImages(document);

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
    mailSettings: MailSettings = DEFAULT_MAIL_SETTINGS,
    onCleanUTMTrackers?: (utmTrackers: MessageUTMTracker[]) => void
): Promise<Preparation> => {
    const plainText = isDraft
        ? body
        : transformLinkify({ content: body, canCleanUTMTrackers: !!mailSettings.ImageProxy, onCleanUTMTrackers });

    return { plainText };
};
