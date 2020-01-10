import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { Computation } from '../../hooks/useMessage';
import { find } from '../embedded/embeddedFinder';
import { mutateHTML, decrypt, prepareImages } from '../embedded/embeddedParser';

export const transformEmbedded: Computation = async (message, { attachmentsCache, api, action = '', mailSettings }) => {
    const { ShowImages = SHOW_IMAGES.NONE } = mailSettings as { ShowImages: SHOW_IMAGES };
    const show = message.showEmbeddedImages === true || ShowImages === SHOW_IMAGES.EMBEDDED;
    const isReplyForward = /^reply|forward/.test(action);
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
        await decrypt(message, api, attachmentsCache);
        mutateHTML(message, direction);
    }

    return { document: message.document, showEmbeddedImages, numEmbedded: attachments.length };
};
