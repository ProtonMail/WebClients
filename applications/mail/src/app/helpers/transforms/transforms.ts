import { message as sanitize } from 'proton-shared/lib/sanitize';
import { Api, MailSettings } from 'proton-shared/lib/interfaces';

import { transformEscape, attachBase64 } from './transformEscape';
import { Base64Cache } from '../../hooks/useBase64Cache';
import { transformBase } from './transformBase';
import { transformLinks } from './transformLinks';
import { transformEmbedded } from './transformEmbedded';
import { MessageExtended, MessageKeys } from '../../models/message';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { transformWelcome } from './transformWelcome';
import { transformStylesheet } from './transformStylesheet';
import { transformRemote } from './transformRemote';
import { inlineCss } from '../dom';

export const prepareMailDocument = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    base64Cache: Base64Cache,
    attachmentsCache: AttachmentsCache,
    api: Api,
    mailSettings?: Partial<MailSettings>
) => {
    const body = inlineCss(sanitize(message.decryptedBody || ''));

    const document = transformEscape(body, base64Cache);

    transformBase(document);

    transformLinks(document);

    const { showEmbeddedImages, embeddeds } = await transformEmbedded(
        { ...message, document },
        messageKeys,
        attachmentsCache,
        api
    );

    transformWelcome(document);

    transformStylesheet(document);

    const { showRemoteImages } = transformRemote({ ...message, document }, mailSettings);

    attachBase64(document, base64Cache);

    return { document, showRemoteImages, showEmbeddedImages, embeddeds };
};
