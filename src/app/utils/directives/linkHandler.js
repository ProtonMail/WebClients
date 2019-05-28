import { PROTON_DOMAINS } from '../../constants';
import { isExternal, getDomain } from '../../../helpers/url';
import { isEdge, isIE11 } from '../../../helpers/browser';

/* @ngInject */
function linkHandler(
    dispatchers,
    messageModel,
    mailSettingsModel,
    mailUtils,
    linkWarningModal,
    notification,
    gettextCatalog
) {
    const { dispatcher } = dispatchers(['composer.new']);
    const dispatch = (type, data = {}) => dispatcher['composer.new'](type, data);
    const getSrc = (target) => {
        const extract = () => {
            try {
                return { encoded: target.toString() || '', raw: target.getAttribute('href') || '' };
            } catch (e) {
                /*
                    Because for Edge/IE11
                    <a href="http://xn--rotonmail-4sg.com" rel="noreferrer nofollow noopener">Protonmail.com</a>
                    will crash --> Unspecified error. ¯\_(ツ)_/¯
                    Don't worry, target.href/getAttribute will crash too ¯\_(ツ)_/¯
                    Ivre, ...
                 */
                const attr = Array.from(target.attributes).find((attr) => (attr || {}).name === 'href');
                return { raw: attr.nodeValue || '' };
            }
        };

        // Because even the fallback canq crash on IE11/Edge. (Now it's a matter of random env issue...)
        try {
            return extract();
        } catch (e) {
            notification.error(
                gettextCatalog.getString(
                    'This message may some URL links that cannot be properly opened by your current browser',
                    null,
                    'Error'
                )
            );
        }
    };

    /**
     * Encode the URL to Remove the punycode from it
     * @param  {String} options.raw     getAttribute('href') -> browser won't encode it
     * @param  {String} options.encoded toString() -> encoded value  USVString
     * @return {String}
     */
    const encoder = async ({ raw = '', encoded }) => {
        // https://en.wikipedia.org/wiki/Punycode#Internationalized_domain_names
        const noEncoding = isIE11() || isEdge() || !/:\/\/xn--/.test(encoded || raw);
        /*
            Fallback, Some browsers don't support USVString at all (IE11, Edge)
            Or when the support is "random".
            Ex: PaleMoon (FF ESR 52) works well BUT for one case, where it's broken cf https://github.com/MoonchildProductions/UXP/issues/1125
            Then when we detect there is no encoding done, we use the lib.
         */
        if (noEncoding) {
            const { punycode } = await import(/* webpackChunkName: "vendorEncoder.module" */ '../../vendorEncoder');

            const [protocol, url = ''] = raw.split('://');

            // Sometimes Blink is enable to decode the URL to convert it again
            const uri = !url.startsWith('%') ? url : decodeURIComponent(url);
            const newUrl = uri
                .split('/')
                .map(punycode.toASCII)
                .join('/');

            return `${protocol}://${newUrl}`;
        }
        return encoded;
    };

    const onClick = async (e) => {
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

        // IE11 and Edge random env bug... (╯°□°）╯︵ ┻━┻
        if (!src) {
            e.preventDefault();
            return false;
        }

        // We only handle anchor that begins with `mailto:`
        if (src.raw.toLowerCase().startsWith('mailto:')) {
            e.preventDefault();

            const message = messageModel(mailUtils.mailtoParser(e.target.getAttribute('href')));

            /*
                Open the composer with the given mailto address
                position isAfter true as the user can choose to set a body
                */
            return dispatch('new', { message, isAfter: true });
        }

        const askForConfirmation = mailSettingsModel.get('ConfirmLink');
        const domain = getDomain(src.raw);

        /*
            If the modal is already active --- do nothing
            ex: click on a link, open the modal, inside the contnue button is an anchor with the same link.
            Don't change anchors behavior
         */
        if (linkWarningModal.active() || src.raw.startsWith('#')) {
            return;
        }

        if (askForConfirmation && isExternal(src.raw) && domain && !PROTON_DOMAINS.includes(domain)) {
            e.preventDefault();
            e.stopPropagation(); // Required for Safari

            return linkWarningModal.activate({
                params: {
                    link: await encoder(src)
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
