import DOMPurify from 'dompurify';

import { unicodeTag } from '../../../helpers/string';

/* @ngInject */
function sanitize() {
    const CONFIG = {
        default: {
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // eslint-disable-line no-useless-escape
            ADD_TAGS: ['proton-src', 'base'],
            ADD_ATTR: ['target', 'proton-src'],
            FORBID_TAGS: ['style', 'input', 'form'],
            FORBID_ATTR: ['srcset']
        },
        // When we display a message we need to be global and return more informations
        raw: { WHOLE_DOCUMENT: true, RETURN_DOM: true },
        html: { WHOLE_DOCUMENT: false, RETURN_DOM: true },
        content: {
            ALLOW_UNKNOWN_PROTOCOLS: true,
            WHOLE_DOCUMENT: false,
            RETURN_DOM: true,
            RETURN_DOM_FRAGMENT: true
        }
    };

    const getConfig = (type) => ({ ...CONFIG.default, ...(CONFIG[type] || {}) });
    const clean = (mode) => {
        const config = getConfig(mode);
        return (input) => {
            const value = DOMPurify.sanitize(input, config);
            if (mode === 'str') {
                // When trusted types is available, DOMPurify returns a trustedHTML object and not a string, force cast it.
                return value + '';
            }
            return value;
        };
    };

    /**
     * Custom config only for messages
     * @param  {String} input
     * @return {String}
     */
    const message = clean('str');

    /**
     * Sanitize input with a config similar than Squire + ours
     * @param  {String} input
     * @return {Document}
     */
    const html = clean('raw');

    /**
     * Sanitize input and returns the whole document
     * @param  {String} input
     * @return {Document}
     */
    const content = clean('content');

    /**
     * Default config we don't want any custom behaviour
     * @return {String}
     */
    const input = (str) => DOMPurify.sanitize(str) + '';

    const toTagUnicode = unicodeTag;

    return { message, input, html, content, toTagUnicode };
}
export default sanitize;
