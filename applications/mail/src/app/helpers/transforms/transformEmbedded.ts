import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { Computation } from '../../hooks/useMessage';
import { find } from '../embedded/embeddedFinder';
import { mutateHTMLBlob, decrypt, prepareImages } from '../embedded/embeddedParser';
import { MESSAGE_ACTIONS } from '../../constants';
import { isDraft } from '../message/messages';

export const transformEmbedded: Computation = async (message, { attachmentsCache, api, mailSettings }) => {
    const { ShowImages = 0 } = mailSettings as { ShowImages: number };
    const show = message.showEmbeddedImages === true || ShowImages === SHOW_IMAGES.EMBEDDED || isDraft(message.data);
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

    return { document: message.document, showEmbeddedImages, embeddeds: message.embeddeds };
};
