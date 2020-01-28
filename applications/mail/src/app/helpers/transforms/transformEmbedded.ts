import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { Computation } from '../../hooks/useMessage';
import { find } from '../embedded/embeddedFinder';
import { mutateHTML, decrypt, prepareImages } from '../embedded/embeddedParser';
import { MESSAGE_ACTIONS } from '../../constants';

export const transformEmbedded: Computation = async (message, { attachmentsCache, api, mailSettings }) => {
    const { ShowImages = 0 } = mailSettings as { ShowImages: number };
    const show = message.showEmbeddedImages === true || ShowImages === SHOW_IMAGES.EMBEDDED;
    const isReplyForward =
        message.action === MESSAGE_ACTIONS.REPLY ||
        message.action === MESSAGE_ACTIONS.REPLY_ALL ||
        message.action === MESSAGE_ACTIONS.FORWARD;
    const isOutside = false; // TODO: const isEoReply = $state.is('eo.reply');

    const attachments = find(message);
    const showEmbeddedImages = prepareImages(message, show, isReplyForward, isOutside);

    const direction = 'blob';

    if (attachments.length === 0 || !show) {
        /**
         * cf #5088 we need to escape the body again if we forgot to set the password First.
         * Prevent unescaped HTML.
         *
         * Don't do it everytime because it's "slow" and we don't want to slow down the process.
         */
        if (isOutside) {
            mutateHTML(message, direction);
        }
    } else {
        await decrypt(message, api, attachmentsCache.data);
        mutateHTML(message, direction);
    }

    return { document: message.document, showEmbeddedImages, numEmbedded: attachments.length };
};
