import _ from 'lodash';
import dedentTpl from '../../../helpers/dedent';
import { PM_SIGNATURE } from '../../constants';
import { toText } from '../../../helpers/parserHTML';


const CLASSNAME_SIGNATURE_CONTAINER = 'protonmail_signature_block';
const CLASSNAME_SIGNATURE_USER = 'protonmail_signature_block-user';
const CLASSNAME_SIGNATURE_PROTON = 'protonmail_signature_block-proton';
const CLASSNAME_SIGNATURE_EMPTY = 'protonmail_signature_block-empty';

/**
 * Generate a space tag, it can be hidden from the UX via a className
 * @param  {String} className
 * @return {String}
 */
function createSpace(className = '') {
    const tagOpen = className ? `<div class="${className}">` : '<div>';
    return `${tagOpen}<br /></div>`;
}

/**
 * Check if the signature is empty for an user
 * @param  {String} addressSignature
 * @return {Boolean}
 */
const isEmptyUserSignature = (addressSignature) => !addressSignature || (addressSignature === '<div><br /></div>' || addressSignature === '<div><br></div>');

/**
 * Extract the signature.
 * Default case is multi line signature but sometimes we have a single line signature
 * without a container.
 * @param  {Node} addressSignature
 * @return {String}
 */
const extractSignature = (addressSignature) => {
    /*
        Default use case, we have a div inside a div for the signature
        we can have a multi line signature
     */
    if (addressSignature.firstElementChild && addressSignature.firstElementChild.nodeName === 'DIV') {
        return toText(addressSignature.innerHTML, false);
    }

    return addressSignature.textContent;
};

/* @ngInject */
function signatureBuilder(authentication, tools, sanitize, AppModel, $rootScope, mailSettingsModel) {

    const PROTON_SIGNATURE = getProtonSignature();
    AppModel.store('protonSignature', !!mailSettingsModel.get('PMSignature'));

    // Update config when we toggle the proton signature on the dashboard
    $rootScope.$on('AppModel', (e, { type }) => {
        type === 'protonSignature' && _.extend(PROTON_SIGNATURE, getProtonSignature());
    });

    /**
     * Preformat the protonMail signature
     * @return {Object}
     */
    function getProtonSignature() {
        if (!mailSettingsModel.get('PMSignature')) {
            return { HTML: '', PLAIN: '' };
        }

        const div = document.createElement('DIV');
        div.innerHTML = PM_SIGNATURE;
        return {
            HTML: PM_SIGNATURE,
            PLAIN: div.textContent
        };
    }

    /**
     * Format the signature as plaintext wrapped inside invisible spaces.
     * @param  {Object} message
     * @return {String}
     */
    function getTXT(message = {}) {
        const [addressSignature] = $.parseHTML(`<div>${getHTML(message, false, true)}</div>`) || [];
        return extractSignature(addressSignature);
    }

    /**
     * Get the signature as HTML
     * @param  {Object}  Message.From
     * @param  {Boolean} isReply      To append spaces before the signature or not
     * @param  {Boolean}  noSpace     Do we want spaces or not, default yes
     * @return {String}
     */
    function getHTML({ From = {} } = {}, isReply = false, noSpace) {
        const addressSignature = From.Signature || '';
        return templateBuilder(addressSignature, isReply, noSpace);
    }

    /**
     * Generate spaces for the signature
     *     No signature: 1 space
     *     addressSignature: 2 spaces + addressSignature
     *     protonSignature: 2 spaces + protonSignature
     *     user + proton signature: 2 spaces + addressSignature + 1 space + protonSignature
     * @param  {String}  addressSignature
     * @param  {Boolean} isReply
     * @return {Object}                  {start: <String>, end: <String>}
     */
    const getSpaces = (addressSignature, isReply = false) => {
        const noUserSignature = isEmptyUserSignature(addressSignature);
        const isEmptySignature = noUserSignature && !PROTON_SIGNATURE.HTML;
        return {
            start: isEmptySignature ? createSpace() : createSpace() + createSpace(),
            end: isReply ? createSpace() : '',
            between: !noUserSignature && PROTON_SIGNATURE.HTML ? createSpace() : ''
        };
    };

    /**
     * Generate a map of classNames used for the signature template
     * @param  {String} addressSignature
     * @return {Object}
     */
    function getClassNamesSignature(addressSignature) {
        const isUserEmpty = isEmptyUserSignature(addressSignature);
        const isProtonEmpty = !PROTON_SIGNATURE.HTML;
        return {
            userClass: isUserEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
            protonClass: isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
            containerClass: isUserEmpty && isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : ''
        };
    }

    /**
     * Generate the template for a signature and clean it
     * @param  {String} addressSignature
     * @param  {String} protonSignature
     * @param  {Boolean} isReply Detect if we create a new message or not
     * @param  {Boolean} noSpace Append spaces around the signature
     * @return {String}
     */
    function templateBuilder(addressSignature = '', isReply = false, noSpace = false) {
        const { userClass, protonClass, containerClass } = getClassNamesSignature(addressSignature);
        const space = getSpaces(addressSignature, isReply);

        const template = dedentTpl`<div class="${CLASSNAME_SIGNATURE_CONTAINER} ${containerClass}">
                <div class="${CLASSNAME_SIGNATURE_USER} ${userClass}">${tools.replaceLineBreaks(addressSignature)}</div>${space.between}
                <div class="${CLASSNAME_SIGNATURE_PROTON} ${protonClass}">${tools.replaceLineBreaks(PROTON_SIGNATURE.HTML)}</div>
            </div>`;

        if (!noSpace) {
            return `${space.start}${sanitize.message(template)}${space.end}`;
        }

        return sanitize.message(template);
    }

    /**
     * Convert signature to plaintext and replace the previous one.
     * We use an invisible space to find and replace the signature.
     * @param  {String} body
     * @param  {Node} addressSignature
     * @return {String}
     */
    function replaceRaw(body = '', signature) {
        return body.replace(/\u200B(\s*?.*?)*?\u200B/, signature);
    }

    /**
     * Insert Signatures before the message
     *     - Always append a container signature with both user's and proton's
     *     - Theses signature can be empty but the dom remains
     *
     * @param  {Message} message
     * @param {Boolean} options.isAfter Append the signature at the end of the content
     * @param {String} options.action Type of signature to build
     * @return {String}
     */
    function insert(message = { getDecryptedBody: angular.noop }, { action = 'new', isAfter = false }) {
        const position = isAfter ? 'beforeEnd' : 'afterBegin';
        const template = getHTML(message, action !== 'new');
        // Parse the current message and append before it the signature
        const [$parser] = $.parseHTML(`<div>${message.getDecryptedBody()}</div>`);
        $parser.insertAdjacentHTML(position, template);

        return $parser.innerHTML;
    }

    /**
     * Update the user signature
     * @param  {Message} message
     * @return {String}
     */
    function update(message = { getDecryptedBody: _.noop, isPlainText: _.noop }, body = '') {

        if (message.isPlainText()) {
            return replaceRaw(message.getDecryptedBody(), getTXT(message));
        }

        const { From = {} } = message;
        const content = From.Signature || '';
        const [dom] = $.parseHTML(`<div>${sanitize.message(body || message.getDecryptedBody())}</div>`) || [];
        const [addressSignature] = $.parseHTML(`<div>${sanitize.message(content)}</div>`) || [];

        /**
         * Update the signature for a user if it exists
         */
        if (dom && addressSignature) {
            const item = dom.querySelector('.' + CLASSNAME_SIGNATURE_USER);
            const isEmptyUser = isEmptyUserSignature(addressSignature.innerHTML);
            const isProtonEmpty = !mailSettingsModel.get('PMSignature');

            // If a user deletes all the content we need to append the signature
            if (!item) {
                // Insert at the end because it can contains some text
                return insert(message, { isAfter: true });
            }

            // Hide empty one as we don't need to display and edit and extra line inside signature
            item.classList[isEmptyUser ? 'add' : 'remove'](CLASSNAME_SIGNATURE_EMPTY);
            item.parentElement.classList[isEmptyUser && isProtonEmpty ? 'add' : 'remove'](CLASSNAME_SIGNATURE_EMPTY);

            item.innerHTML = addressSignature.innerHTML;
        }

        // Return the message with the new signature
        return dom.innerHTML;
    }

    return { insert, update, getHTML, getTXT };
}
export default signatureBuilder;
