import { CrossStorageTimeoutError, CrossStorageUnsupportedError } from './errors';
import { CrossStorageMessage } from './interface';
import { getIsSupported } from './support';

enum States {
    INIT,
    SUCCESS,
    ERROR,
}

const createGuest = <MessagePayload>(urlTarget: string) => {
    let iframe: HTMLIFrameElement;
    let state = States.INIT;
    let promiseHandler: {
        promise: Promise<void>;
        resolve: () => void;
        reject: (error: Error) => void;
    };
    const url = new URL(urlTarget);
    let id = 0;
    const messagePromiseCache: {
        [key: string]: { resolve: (value: any) => void; reject: (error: Error) => void };
    } = {};

    const initPromise = () => {
        promiseHandler = {} as any;
        promiseHandler.promise = new Promise<void>((resolve, reject) => {
            promiseHandler.resolve = resolve;
            promiseHandler.reject = reject;
        });
        promiseHandler.promise.catch(() => {});
    };

    const initListener = (origin: string) => {
        const timeoutHandle = window.setTimeout(() => {
            state = States.ERROR;
            promiseHandler.reject(new CrossStorageTimeoutError());
        }, 5000);

        window.addEventListener('message', (event: MessageEvent<CrossStorageMessage>) => {
            if (!iframe) {
                return;
            }

            const contentWindow = iframe?.contentWindow;
            if (!iframe || !contentWindow || event.origin !== origin || event.source !== contentWindow) {
                return;
            }

            const eventData = event.data;
            if (!eventData?.type) {
                return;
            }

            if (eventData.type === 'init') {
                window.clearTimeout(timeoutHandle);
                if (getIsSupported(eventData.payload.value)) {
                    state = States.SUCCESS;
                    promiseHandler.resolve();
                } else {
                    state = States.ERROR;
                    promiseHandler.reject(new CrossStorageUnsupportedError());
                }
            }

            if (state !== States.SUCCESS) {
                return;
            }

            if (eventData.type === 'response') {
                if (eventData.status === 'success') {
                    messagePromiseCache[eventData.id]?.resolve(eventData.payload);
                }
                if (eventData.status === 'error') {
                    messagePromiseCache[eventData.id]?.reject(eventData.payload);
                }
            }
        });
    };

    const loadIframe = (url: string) => {
        iframe = window.document.createElement('iframe');
        iframe.src = url;
        iframe.width = '0';
        iframe.height = '0';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    };

    const getState = () => {
        return state;
    };

    const getMessagePromise = <T>(id: number) => {
        return new Promise<T>((resolve, reject) => {
            messagePromiseCache[id] = {
                resolve,
                reject,
            };
        });
    };

    const postMessage = async (message: CrossStorageMessage) => {
        await promiseHandler.promise;
        iframe.contentWindow?.postMessage(message, url.origin);
    };

    const postAndGetMessage = async <T>(messagePayload: MessagePayload) => {
        const messageId = id++;
        const promise = getMessagePromise<T>(messageId);
        await postMessage({
            type: 'message',
            id: messageId,
            payload: messagePayload,
        });
        return promise;
    };

    const initChildCrossStorage = () => {
        initPromise();
        initListener(url.origin);
        loadIframe(url.toString());
    };

    initChildCrossStorage();

    return {
        supported: async () => {
            try {
                await promiseHandler.promise;
                return true;
            } catch (e) {
                return false;
            }
        },
        getState,
        postAndGetMessage,
    };
};

export default createGuest;
