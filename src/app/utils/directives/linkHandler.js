import { PROTON_DOMAINS, LINK_WARNING } from '../../constants';
import { isExternal, getDomain } from '../../../helpers/url';
import { getItem } from '../../../helpers/storageHelper';

/* @ngInject */
function linkHandler(dispatchers, messageModel, mailUtils, linkWarningModal) {
    const { dispatcher } = dispatchers(['composer.new']);
    const dispatch = (type, data = {}) => dispatcher['composer.new'](type, data);
    const getSrc = (target) => target.getAttribute('href') || '';

    const onClick = (e) => {
        /*
            We can click on an image inside a link.
            more informations inside the css, look at:
                 .message-body-container a *:not(img)
         */
        if (!['A', 'IMG'].includes(e.target.nodeName)) {
            return;
        }

        const isIMG = e.target.nodeName === 'IMG';
        const node = !isIMG ? e.target : e.target.parentElement;

        if (node.nodeName !== 'A') {
            return;
        }

        const src = getSrc(node);

        // We only handle anchor that begins with `mailto:`
        if (src.toLowerCase().startsWith('mailto:')) {
            e.preventDefault();

            const message = messageModel(mailUtils.mailtoParser(e.target.getAttribute('href')));

            /*
                Open the composer with the given mailto address
                position isAfter true as the user can choose to set a body
                */
            return dispatch('new', { message, isAfter: true });
        }

        const dontAsk = getItem(LINK_WARNING.KEY);
        const domain = getDomain(src);

        /*
            If the modal is already active --- do nothing
            ex: click on a link, open the modal, inside the contnue button is an anchor with the same link.
            Don't change anchors behavior
         */
        if (linkWarningModal.active() || src.startsWith('#')) {
            return;
        }

        if (!dontAsk && isExternal(src) && domain && !PROTON_DOMAINS.includes(domain)) {
            e.preventDefault();
            e.stopPropagation(); // Required for Safari
            return linkWarningModal.activate({
                params: {
                    link: src,
                    close() {
                        linkWarningModal.deactivate();
                    }
                }
            });
        }
    };

    return {
        link(scope) {
            document.body.addEventListener('click', onClick, false);

            scope.$on('$destroy', () => {
                document.body.removeEventListener('click', onClick, false);
            });
        }
    };
}
export default linkHandler;
