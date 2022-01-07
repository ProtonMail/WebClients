import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import { CrossStorageMessage, ResponseMessage } from './interface';
import { getTestKeyValue, setTestKeyValue } from './support';

const createHost = <Message, MessageResponse>(handler: (message: Message) => Promise<MessageResponse>) => {
    const isEmbedded = window.location !== window.parent.location;
    const hostSecondLevelDomain = getSecondLevelDomain(window.location.hostname);

    if (!isEmbedded) {
        throw new Error('Window not embedded');
    }

    const postMessage = (message: CrossStorageMessage, origin: string) => {
        return window.parent.postMessage(message, origin);
    };

    postMessage({ type: 'init', payload: { value: getTestKeyValue(window) } }, '*');

    const reply = (origin: string, payload: ResponseMessage<MessageResponse>) => {
        postMessage(payload, origin);
    };

    window.addEventListener('message', (event: MessageEvent<CrossStorageMessage>) => {
        const { source, data, origin } = event;
        if (
            source !== window.parent ||
            getSecondLevelDomain(new URL(origin).hostname) !== hostSecondLevelDomain ||
            data?.type !== 'message'
        ) {
            return;
        }
        handler(data.payload)
            .then((response) => {
                reply(origin, { id: data.id, type: 'response', status: 'success', payload: response });
            })
            .catch((e) => {
                reply(origin, {
                    id: data.id,
                    type: 'response',
                    status: 'error',
                    payload: e,
                });
            });
    });
};

export const initMainHost = () => {
    setTestKeyValue(window);
};

export default createHost;
