import { EMBEDDED } from '../../constants';
import { isInlineEmbedded, isEmbedded } from '../../../helpers/imageHelper';

/* @ngInject */
function transformEmbedded(embedded, $state, mailSettingsModel) {
    const EMBEDDED_CLASSNAME = 'proton-embedded';
    const wrapImage = (img) => angular.element(img).wrap('<div class="image loading"></div>');

    return (html, message, { action }) => {
        const images = [].slice.call(html.querySelectorAll('img[proton-src]'));
        const { ShowImages = 0 } = mailSettingsModel.get();
        const isReplyForward = /^reply|forward/.test(action);
        const show = message.showEmbedded === true || ShowImages & EMBEDDED;
        const isEoReply = $state.is('eo.reply');

        images.forEach((image) => {
            const src = image.getAttribute('proton-src');
            image.setAttribute('referrerPolicy', 'no-referrer');
            const attachment = embedded.getAttachment(message, src);

            if (!image.classList.contains(EMBEDDED_CLASSNAME)) {
                image.classList.add(EMBEDDED_CLASSNAME);
            }

            // check if the attachment exist before processing
            if (!(attachment && Object.keys(attachment).length > 0)) {
                /**
                 * If the attachment does not exist and the proton-src attribute
                 * starts with cid:, it's an embedded image that does not exist in the list of attachments,
                 * or is not a valid image.
                 * So remove the element from the DOM because it will not display anything useful anyway.
                 */
                if (isEmbedded(src)) {
                    image.parentElement.removeChild(image);
                }
                // If it's not an inline embedded image, it's either an embedded image or a remote image. So stop here.
                // Otherwise, continue so that the inline image is detected as an embedded image.
                if (!isInlineEmbedded(src)) {
                    return;
                }
            }

            if (show) {
                image.setAttribute('data-embedded-img', src);

                // Auto load image inside a reply draft
                if (isReplyForward) {
                    image.src = embedded.getUrl(image);
                    return;
                }

                // We don't need to add it outside
                if (!isEoReply) {
                    !image.parentElement.classList.contains('loading') && wrapImage(image);
                    image.removeAttribute('src');
                }
                return;
            }

            message.showEmbedded = false;
            // Inline embedded images does not have an attachment.
            if (attachment) {
                image.setAttribute('alt', attachment.Name);
            }
        });

        return html;
    };
}
export default transformEmbedded;
