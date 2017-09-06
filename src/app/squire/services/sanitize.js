angular.module('proton.utils')
    .factory('sanitize', () => {

        /**
         * Custom config only for messages
         * @param  {String} input
         * @return {String}
         */
        const message = (input) => {
            return DOMPurify.sanitize(input, {
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // eslint-disable-line no-useless-escape
                ADD_TAGS: ['proton-src'],
                ADD_ATTR: ['target', 'proton-src'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
        };

        /**
         * Default config we don't want any custom behaviour
         */
        const input = DOMPurify.sanitize;

        return { message, input };
    });
