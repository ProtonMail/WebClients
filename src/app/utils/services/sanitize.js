/* @ngInject */
function sanitize() {
    const CONFIG = {
        default: {
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // eslint-disable-line no-useless-escape
            ADD_TAGS: ['proton-src', 'base'],
            ADD_ATTR: ['target', 'proton-src'],
            FORBID_TAGS: ['style', 'input', 'form']
        },
        // When we display a message we need to be global and return more informations
        raw: { WHOLE_DOCUMENT: true, RETURN_DOM: true },
        content: {
            ALLOW_UNKNOWN_PROTOCOLS: true,
            WHOLE_DOCUMENT: false,
            RETURN_DOM: true,
            RETURN_DOM_FRAGMENT: true
        }
    };

    const getConfig = (type) => ({ ...CONFIG.default, ...(CONFIG[type] || {}) });

    /**
     * Custom config only for messages
     * @param  {String} input
     * @param  {Boolean} raw Format the message and return the whole document
     * @return {String|Document}
     */
    const message = (input) => DOMPurify.sanitize(input, getConfig());

    /**
     * Sanitize input with a config similar than Squire + ours
     * @param  {String} input
     * @return {Document}
     */
    const html = (input) => DOMPurify.sanitize(input, getConfig('raw'));

    /**
     * Sanitize input and returns the whole document
     * @param  {String} input
     * @return {Document}
     */
    const content = (input) => DOMPurify.sanitize(input, getConfig('content'));

    /**
     * Default config we don't want any custom behaviour
     */
    const input = DOMPurify.sanitize;

    return { message, input, html, content };
}
export default sanitize;
