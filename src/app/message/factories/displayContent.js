angular.module('proton.message')
    .factory('displayContent', ($rootScope, $q, $filter, prepareContent, sanitize) => {

        function decrypt(message) {
            message.decrypting = true;
            return message.clearTextBody()
                .then((body) => (message.decrypting = false, body));
        }

        function withType(body, { MIMEType }) {
            const type = (MIMEType === 'text/plain') ? 'plain' : 'html';
            return { body, type };
        }

        function clean(content = {}) {
            // Don't sanitize if plain text
            if (content.type === 'plain') {
                return content;
            }

            // Clear content with DOMPurify before anything happen!
            content.body = sanitize.message(content.body);
            return content;
        }

        function prepare(content, message) {

            if (content.type === 'html') {
                content.body = prepareContent(content.body, message);
            } else {
                content.body = $filter('linky')(content.body, '_blank', {
                    rel: 'noreferrer nofollow noopener'
                });
            }

            return content;
        }

        function read({ ID }) {
            $rootScope.$emit('messageActions', { action: 'read', data: { ids: [ID] } });
        }

        return (message, body) => {

            if (body) {
                read(message);
                return $q.when(withType(body, message));
            }

            return decrypt(message)
                .then((body) => withType(body, message))
                .then((content) => clean(content))
                .then((content) => prepare(content, message))
                .then((content) => (read(message), content));
        };
    });
