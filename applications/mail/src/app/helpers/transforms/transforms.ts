import { Api, MailSettings } from '@proton/shared/lib/interfaces';
import { DecryptResultPmcrypto } from 'pmcrypto';
import { transformEscape, attachBase64 } from './transformEscape';
import { Base64Cache } from '../../hooks/useBase64Cache';
import { transformBase } from './transformBase';
import { transformLinks } from './transformLinks';
import { transformEmbedded } from './transformEmbedded';
import { MessageExtended, MessageKeys } from '../../models/message';
import { transformWelcome } from './transformWelcome';
import { transformStylesheet } from './transformStylesheet';
import { transformRemote } from './transformRemote';
import { transformLinkify } from './transformLinkify';
import { MessageCache } from '../../containers/MessageProvider';

export const prepareHtml = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    messageCache: MessageCache,
    base64Cache: Base64Cache,
    getAttachment: (ID: string) => DecryptResultPmcrypto | undefined,
    onUpdateAttachment: (ID: string, attachment: DecryptResultPmcrypto) => void,
    api: Api,
    mailSettings: MailSettings | undefined
) => {
    const document = transformEscape(message.decryptedBody, base64Cache);

    transformBase(document);

    transformLinks(document);

    const { showEmbeddedImages, hasEmbeddedImages, embeddedImages } = await transformEmbedded(
        { ...message, document },
        messageKeys,
        messageCache,
        getAttachment,
        onUpdateAttachment,
        api,
        mailSettings
    );

    transformWelcome(document);

    transformStylesheet(document);

    const { showRemoteImages, hasRemoteImages, remoteImages } = transformRemote(
        { ...message, document },
        mailSettings,
        api,
        messageCache
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

export const preparePlainText = async (body: string, isDraft: boolean) => {
    const plainText = isDraft ? body : transformLinkify(body);

    return { plainText };
};
