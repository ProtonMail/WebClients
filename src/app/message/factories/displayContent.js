/* @ngInject */
function displayContent($rootScope, $q, $filter, prepareContent, sanitize) {
    const read = ({ ID }) => $rootScope.$emit('messageActions', { type: 'read', data: { ids: [ID] } });

    async function decrypt(message) {
        message.decrypting = true;
        const body = await message.clearTextBody();
        message.decrypting = false;
        return body;
    }

    function withType(body, { MIMEType }) {
        const type = MIMEType === 'text/plain' ? 'plain' : 'html';
        return { body, type };
    }

    function clean(content = {}) {
        // Don't sanitize if plain text
        if (content.type === 'plain') {
            return content;
        }

        // Clear content with DOMPurify before anything happen!
        content.body = sanitize.html(content.body);
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

    return async (message, body) => {
        read(message);

        if (body) {
            return withType(body, message);
        }

        const text = await decrypt(message);
        const content = withType(text, message);
        return prepare(clean(content), message);
    };
}
export default displayContent;
