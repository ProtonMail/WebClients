import _ from 'lodash';

/* @ngInject */
function signatureBuilder(authentication, CONSTANTS, tools, sanitize, AppModel, $rootScope, mailSettingsModel) {
    const CLASSNAME_SIGNATURE_CONTAINER = 'protonmail_signature_block';
    const CLASSNAME_SIGNATURE_USER = 'protonmail_signature_block-user';
    const CLASSNAME_SIGNATURE_PROTON = 'protonmail_signature_block-proton';
    const CLASSNAME_SIGNATURE_EMPTY = 'protonmail_signature_block-empty';

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
        div.innerHTML = CONSTANTS.PM_SIGNATURE;
        return {
            HTML: CONSTANTS.PM_SIGNATURE,
            PLAIN: div.textContent
        };
    }

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
     * @param  {String} userSignature
     * @return {Boolean}
     */
    const isEmptyUserSignature = (userSignature) => !userSignature || (userSignature === '<div><br /></div>' || userSignature === '<div><br></div>');

    /**
     * Generate a map of classNames used for the signature template
     * @param  {String} userSignature
     * @return {Object}
     */
    function getClassNamesSignature(userSignature) {
        const isUserEmpty = isEmptyUserSignature(userSignature);
        const isProtonEmpty = !PROTON_SIGNATURE.HTML;
        return {
            userClass: isUserEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
            protonClass: isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
            containerClass: isUserEmpty && isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : ''
        };
    }

    /**
     * Generate spaces for the signature
     *     No signature: 1 space
     *     userSignature: 2 spaces + userSignature
     *     protonSignature: 2 spaces + protonSignature
     *     user + proton signature: 2 spaces + userSignature + 1 space + protonSignature
     * @param  {String}  userSignature
     * @param  {Boolean} isReply
     * @return {Object}                  {start: <String>, end: <String>}
     */
    const getSpaces = (userSignature, isReply = false) => {
        const noUserSignature = isEmptyUserSignature(userSignature);
        const isEmptySignature = noUserSignature && !PROTON_SIGNATURE.HTML;
        return {
            start: isEmptySignature ? createSpace() : createSpace() + createSpace(),
            end: isReply ? createSpace() : '',
            between: !noUserSignature && PROTON_SIGNATURE.HTML ? createSpace() : ''
        };
    };

    /**
     * Generate the template for a signature and clean it
     * @param  {String} userSignature
     * @param  {String} protonSignature
     * @param  {Boolean} isReply Detect if we create a new message or not
     * @return {String}
     */
    function templateBuilder(userSignature = '', isReply = false) {
        const { userClass, protonClass, containerClass } = getClassNamesSignature(userSignature);
        const space = getSpaces(userSignature, isReply);

        const template = `${space.start}<div class="${CLASSNAME_SIGNATURE_CONTAINER} ${containerClass}">
                <div class="${CLASSNAME_SIGNATURE_USER} ${userClass}">${tools.replaceLineBreaks(userSignature)}</div>${space.between}
                <div class="${CLASSNAME_SIGNATURE_PROTON} ${protonClass}">${tools.replaceLineBreaks(PROTON_SIGNATURE.HTML)}</div>
            </div>${space.end}`;

        return sanitize.message(template);
    }

    /**
     * Extract the signature.
     * Default case is multi line signature but sometimes we have a single line signature
     * without a container.
     * @param  {Node} userSignature
     * @return {String}
     */
    const extractSignature = (userSignature) => {
        /*
            Default use case, we have a div inside a div for the signature
            we can have a multi line signature
         */
        if (userSignature.firstElementChild && userSignature.firstElementChild.nodeName === 'DIV') {
            return [...userSignature.querySelectorAll('div')].reduce((acc, node) => `${acc}\n${node.textContent}`, '');
        }

        return userSignature.textContent;
    };

    /**
     * Convert signature to plaintext and replace the previous one.
     * We use an invisible space to find and replace the signature.
     * @param  {String} body
     * @param  {Node} userSignature
     * @return {String}
     */
    function replaceRaw(body = '', userSignature) {
        const signature = extractSignature(userSignature);
        /* eslint no-irregular-whitespace: "off" */
        return body.replace(/​(\s*?.*?)*?​/, `​${signature}\n${PROTON_SIGNATURE.PLAIN}​`);
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
        const { From = {} } = message;
        const position = isAfter ? 'beforeEnd' : 'afterBegin';
        const userSignature = !From.Signature ? mailSettingsModel.get('Signature') : From.Signature;
        const template = templateBuilder(userSignature, action !== 'new');
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
        const { From = {} } = message;
        const content = (!From.Signature ? mailSettingsModel.get('Signature') : From.Signature) || '';
        const [userSignature] = $.parseHTML(`<div>${sanitize.message(content)}</div>`) || [];

        if (message.isPlainText()) {
            return replaceRaw(message.getDecryptedBody(), userSignature);
        }

        const [dom] = $.parseHTML(`<div>${sanitize.message(body || message.getDecryptedBody())}</div>`) || [];
        /**
         * Update the signature for a user if it exists
         */
        if (dom && userSignature) {
            const item = dom.querySelector('.' + CLASSNAME_SIGNATURE_USER);
            const isEmptyUser = isEmptyUserSignature(userSignature.innerHTML);
            const isProtonEmpty = !mailSettingsModel.get('PMSignature');

            // If a user deletes all the content we need to append the signature
            if (!item) {
                // Insert at the end because it can contains some text
                return insert(message, { isAfter: true });
            }

            // Hide empty one as we don't need to display and edit and extra line inside signature
            item.classList[isEmptyUser ? 'add' : 'remove'](CLASSNAME_SIGNATURE_EMPTY);
            item.parentElement.classList[isEmptyUser && isProtonEmpty ? 'add' : 'remove'](CLASSNAME_SIGNATURE_EMPTY);

            item.innerHTML = userSignature.innerHTML;
        }

        // Return the message with the new signature
        return dom.innerHTML;
    }

    return { insert, update };
}
export default signatureBuilder;
