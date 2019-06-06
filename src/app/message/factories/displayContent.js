import linkit from '../../../helpers/linkifyHelper';
import { MIME_TYPES } from '../../constants';

const { PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function displayContent(dispatchers, prepareContent, sanitize) {
    const { dispatcher } = dispatchers(['messageActions']);
    const read = ({ ID }) => dispatcher.messageActions('read', { ids: [ID] });

    async function decrypt(message) {
        message.decrypting = true;
        const body = await message.clearTextBody(false, false);
        message.decrypting = false;
        return body;
    }

    function withType(body, { MIMEType }) {
        const type = MIMEType === PLAINTEXT ? 'plain' : 'html';
        return { body, type };
    }

    function clean(content = {}) {
        // Don't sanitize if plain text. The linkit helper will do that. It can't receive escaped input because it will not find link to highlight properly.
        if (content.type === 'plain') {
            return content;
        }

        // Clear content with DOMPurify before anything happen!
        content.body = sanitize.html(content.body);
        return content;
    }

    function prepare(content, message) {
        if (content.type === 'html') {
            content.body = prepareContent(content.body, message, {
                countEmbedded: true
            });
        } else {
            content.body = linkit(content.body);
            message.NumEmbedded = message.countEmbedded();
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
