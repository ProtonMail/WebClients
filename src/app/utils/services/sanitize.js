/* @ngInject */
function sanitize() {
    const CONFIG = {
        default: {
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // eslint-disable-line no-useless-escape
            ADD_TAGS: ['proton-src', 'base'],
            ADD_ATTR: ['target', 'proton-src'],
            FORBID_TAGS: ['style', 'input', 'form']
        },
        // When we display a message we need to be global and return more informations
        raw: { WHOLE_DOCUMENT: true, RETURN_DOM: true }
    };

    /**
     * Custom config only for messages
     * @param  {String} input
     * @return {String}
     */
    const message = (input, raw = false) => {
        const config = !raw ? CONFIG.default : _.extend({}, CONFIG.default, CONFIG.raw);
        return DOMPurify.sanitize(input, config);
    };

    /**
     * Default config we don't want any custom behaviour
     */
    const input = DOMPurify.sanitize;

    return { message, input };
}
export default sanitize;
