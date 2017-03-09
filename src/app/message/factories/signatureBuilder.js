angular.module('proton.message')
    .factory('signatureBuilder', (authentication, CONSTANTS, tools) => {

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
            const tagOpen = (className) ? `<div class="${className}">` : '<div>';
            return `${tagOpen}<br /></div>`;
        }

        function purify(html = '') {
            return DOMPurify.sanitize(html, {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
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
         * @param  {String} protonSignature
         * @return {Object}
         */
        function getClassNamesSignature(userSignature, protonSignature) {
            const isUserEmpty = isEmptyUserSignature(userSignature);
            const isProtonEmpty = !protonSignature;
            return {
                userClass: isUserEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
                protonClass: isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
                containerClass: (isUserEmpty && isProtonEmpty) ? CLASSNAME_SIGNATURE_EMPTY : ''
            };
        }

        /**
         * Generate spaces for the signature
         *     No signature: 1 space
         *     userSignature: 2 spaces + userSignature
         *     protonSignature: 2 spaces + protonSignature
         *     user + proton signature: 2 spaces + userSignature + 1 space + protonSignature
         * @param  {String}  userSignature
         * @param  {String}  protonSignature
         * @param  {Boolean} isReply
         * @return {Object}                  {start: <String>, end: <String>}
         */
        const getSpaces = (userSignature, protonSignature, isReply = false) => {
            const noUserSignature = isEmptyUserSignature(userSignature);
            const isEmptySignature = noUserSignature && !protonSignature;
            return {
                start: isEmptySignature ? createSpace() : (createSpace() + createSpace()),
                end: isReply ? createSpace() : '',
                between: (!noUserSignature && protonSignature) ? createSpace() : ''
            };
        };

        /**
         * Generate the template for a signature and clean it
         * @param  {String} userSignature
         * @param  {String} protonSignature
         * @param  {Boolean} isReply Detect if we create a new message or not
         * @return {String}
         */
        function templateBuilder(userSignature = '', protonSignature = '', isReply = false) {
            const { userClass, protonClass, containerClass } = getClassNamesSignature(userSignature, protonSignature);
            const space = getSpaces(userSignature, protonSignature, isReply);

            const template = `${space.start}<div class="${CLASSNAME_SIGNATURE_CONTAINER} ${containerClass}">
                <div class="${CLASSNAME_SIGNATURE_USER} ${userClass}">${tools.replaceLineBreaks(userSignature)}</div>${space.between}
                <div class="${CLASSNAME_SIGNATURE_PROTON} ${protonClass}">${tools.replaceLineBreaks(protonSignature)}</div>
            </div>${space.end}`;

            return purify(template);
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
            const userSignature = !From.Signature ? authentication.user.Signature : From.Signature;
            const protonSignature = authentication.user.PMSignature ? CONSTANTS.PM_SIGNATURE : '';
            const template = templateBuilder(userSignature, protonSignature, action !== 'new');
            // Parse the current message and append before it the signature
            const [ $parser ] = $.parseHTML(`<div>${message.getDecryptedBody()}</div>`);
            $parser.insertAdjacentHTML(position, template);

            return $parser.innerHTML;
        }

        /**
         * Update the user signature
         * @param  {Message} message
         * @return {String}
         */
        function update(message = { getDecryptedBody: angular.noop }, body = '') {

            const { From = {} } = message;
            const content = !From.Signature ? authentication.user.Signature : From.Signature;

            const [ dom ] = $.parseHTML(`<div>${purify(body || message.getDecryptedBody())}</div>`) || [];
            const [ userSignature ] = $.parseHTML(`<div>${purify(content)}</div>`) || [];

            /**
             * Update the signature for a user if it exists
             */
            if (dom && userSignature) {
                const item = dom.querySelector('.' + CLASSNAME_SIGNATURE_USER);
                const isEmptyUser = isEmptyUserSignature(userSignature.innerHTML);
                const isProtonEmpty = !authentication.user.PMSignature;

                // If a user deletes all the content we need to append the signature
                if (!item) {
                    // Insert at the end because it can contains some text
                    return insert(message, { isAfter: true });
                }

                // Hide empty one as we don't need to display and edit and extra line inside signature
                item.classList[isEmptyUser ? 'add' : 'remove'](CLASSNAME_SIGNATURE_EMPTY);
                item.parentElement.classList[(isEmptyUser && isProtonEmpty) ? 'add' : 'remove'](CLASSNAME_SIGNATURE_EMPTY);

                item.innerHTML = userSignature.innerHTML;
            }

            // Return the message with the new signature
            return dom.innerHTML;
        }

        return { insert, update };
    });
