angular.module('proton.utils')
    .factory('sanitize', () => {

        const message = (input) => {
            return DOMPurify.sanitize(input, {
                ADD_TAGS: ['proton-src'],
                ADD_ATTR: ['target', 'proton-src'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
        };

        const input = (input) => {
            return DOMPurify.sanitize(input, {
                ADD_TAGS: ['proton-src'],
                ADD_ATTR: ['proton-src']
            });
        };

        return { message, input };
    });
