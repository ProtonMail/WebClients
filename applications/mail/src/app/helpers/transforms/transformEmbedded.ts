import { Api, MailSettings } from 'proton-shared/lib/interfaces';

import { find } from '../embedded/embeddedFinder';
import { mutateHTMLBlob, decrypt, prepareImages } from '../embedded/embeddedParser';
import { MESSAGE_ACTIONS } from '../../constants';
import { isDraft } from '../message/messages';
import { MessageExtended } from '../../models/message';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { hasShowEmbedded } from '../settings';

export const transformEmbedded = async (
    message: MessageExtended,
    attachmentsCache: AttachmentsCache,
    api: Api,
    mailSettings: MailSettings
) => {
    const show = message.showEmbeddedImages === true || hasShowEmbedded(mailSettings) || isDraft(message.data);
    const isReplyForward =
        message.action === MESSAGE_ACTIONS.REPLY ||
        message.action === MESSAGE_ACTIONS.REPLY_ALL ||
        message.action === MESSAGE_ACTIONS.FORWARD;
    const isOutside = false; // TODO: const isEoReply = $state.is('eo.reply');

    message.embeddeds = find(message, message.document as Element);
    const showEmbeddedImages = prepareImages(message, show, isReplyForward, isOutside);

    if (message.embeddeds.size === 0 || !show) {
        /**
         * cf #5088 we need to escape the body again if we forgot to set the password First.
         * Prevent unescaped HTML.
         *
         * Don't do it everytime because it's "slow" and we don't want to slow down the process.
         */
        if (isOutside) {
            mutateHTMLBlob(message.embeddeds, message.document);
        }
    } else {
        await decrypt(message, api, attachmentsCache);
        mutateHTMLBlob(message.embeddeds, message.document);
    }

    return { showEmbeddedImages, embeddeds: message.embeddeds };
};
