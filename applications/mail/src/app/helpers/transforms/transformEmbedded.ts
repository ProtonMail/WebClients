import { Api, MailSettings } from 'proton-shared/lib/interfaces';
import { isDraft } from 'proton-shared/lib/mail/messages';
import { find } from '../embedded/embeddedFinder';
import { mutateHTMLBlob, decrypt, prepareImages } from '../embedded/embeddedParser';
import { MessageExtended, MessageKeys } from '../../models/message';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MessageCache, updateMessageCache } from '../../containers/MessageProvider';
import { hasShowEmbedded } from '../mailSettings';

export const transformEmbedded = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    messageCache: MessageCache,
    attachmentsCache: AttachmentsCache,
    api: Api,
    mailSettings: MailSettings | undefined
) => {
    const show = message.showEmbeddedImages === true || hasShowEmbedded(mailSettings) || isDraft(message.data);

    message.embeddeds = find(message, message.document as Element);
    const showEmbeddedImages = prepareImages(message, show);

    if (show && message.embeddeds.size) {
        const run = async () => {
            await decrypt(message, messageKeys, api, attachmentsCache);

            const messageAfterDowload = messageCache.get(message.localID) as MessageExtended;
            mutateHTMLBlob(message.embeddeds, messageAfterDowload.document);
            updateMessageCache(messageCache, message.localID, { document: messageAfterDowload.document });
        };

        // Run asynchronously to render loader first and update document later
        void run();
    }

    return { showEmbeddedImages, embeddeds: message.embeddeds };
};
