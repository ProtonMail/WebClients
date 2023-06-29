import { MailSettings } from '@proton/shared/lib/interfaces';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { transformLinkify } from '@proton/shared/lib/mail/transformLinkify';
import { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import { Base64Cache } from '../../hooks/useBase64Cache';
import {
    LoadEmbeddedResults,
    MessageImage,
    MessageRemoteImage,
    MessageState,
} from '../../logic/messages/messagesTypes';
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
    mailSettings: MailSettings | undefined,
    onLoadEmbeddedImages: (attachments: Attachment[]) => Promise<LoadEmbeddedResults>,
    onLoadRemoteImagesProxy: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadFakeImagesProxy: (imagesToLoad: MessageRemoteImage[], firstLoad?: boolean) => void,
    onLoadRemoteImagesDirect: (imagesToLoad: MessageRemoteImage[]) => void,
    onCleanUTMTrackers: (utmTrackers: MessageUTMTracker[]) => void,
    canCleanUTMTrackersFeature: boolean
): Promise<Preparation> => {
    const document = transformEscape(message.decryption?.decryptedBody, base64Cache);

    const canCleanUTMTrackers = canCleanUTMTrackersFeature && (!!mailSettings?.ImageProxy || false);

    transformBase(document);

    transformLinks(document, onCleanUTMTrackers, canCleanUTMTrackers);

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
    mailSettings?: MailSettings,
    canCleanUTMTrackersFeature?: boolean,
    onCleanUTMTrackers?: (utmTrackers: MessageUTMTracker[]) => void
): Promise<Preparation> => {
    const canCleanUTMTrackers = canCleanUTMTrackersFeature && (!!mailSettings?.ImageProxy || false);

    const plainText = isDraft ? body : transformLinkify({ content: body, canCleanUTMTrackers, onCleanUTMTrackers });

    return { plainText };
};
