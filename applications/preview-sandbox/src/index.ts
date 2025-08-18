import { handleMessage, postError } from './message';

window.addEventListener('load', () => {
    window.addEventListener('message', (event) => {
        // Our iframe can receive messages from multiple places,
        // so we ensure we are getting messages from the correct origin
        if (event.origin !== window.location.origin) {
            // We don't log here as it can be spammy
            return;
        }

        const message = event.data;

        if (typeof message !== 'object' || !message.type) {
            postError(new Error('Unexpected message format'));
            return;
        }

        handleMessage(message);
    });
});
