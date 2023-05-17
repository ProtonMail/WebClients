import getRandomString from '@proton/utils/getRandomString';

export type ExtensionMessage<T = {}> = { type: string } & T;

/* extension communicating with account should
 * conform to this message response type */
export type ExtensionMessageResponse<P extends {}> =
    | { type: 'success'; payload: P }
    | { type: 'error'; payload?: P; error?: string };

/* message fallback should contain the initial message's
 * type as a property in order to ensure we're dealing
 * with the appropriate response message */
export type ExtensionMessageFallbackResponse<P extends {}> = ExtensionMessageResponse<P> & {
    token: string;
};

export const sendMessageSupported = () =>
    'chrome' in window && (window as any).chrome?.runtime?.sendMessage !== undefined;

/* Extension messaging must account for Chrome & Firefox specifics :
 * Chrome : we can leverage the `externally_connectable` permissions
 * Firefox : we have to result to fallback postMessaging via content
 * script injections */
export const sendExtensionMessage = async <T extends ExtensionMessage, R extends {} = {}>(
    message: T,
    options: {
        extensionId: string;
        maxTimeout?: number;
        onFallbackMessage?: (event: MessageEvent<any>) => ExtensionMessageResponse<R> | undefined;
    }
): Promise<ExtensionMessageResponse<R>> => {
    let timeout: NodeJS.Timeout;
    const token = getRandomString(16);

    return new Promise<ExtensionMessageResponse<R>>((resolve) => {
        /* in order to support legacy message formats : allow
         * intercepting event via `options.onFallbackMessage` */
        const onFallbackMessage = (event: MessageEvent<ExtensionMessageFallbackResponse<R>>) => {
            const externalMessage = (event.data as any).extension === undefined;

            if (event.source === window && externalMessage) {
                const intercepted = options?.onFallbackMessage?.(event);
                const valid = intercepted !== undefined || event.data?.token === token;

                if (valid) {
                    clearTimeout(timeout);
                    window.removeEventListener('message', onFallbackMessage);
                    resolve(intercepted ?? event.data);
                }
            }
        };

        timeout = setTimeout(() => {
            window.removeEventListener('message', onFallbackMessage);
            resolve({ type: 'error', error: 'Extension timed out' });
        }, options.maxTimeout ?? 15_000);

        if (sendMessageSupported()) {
            const browser = (window as any).chrome;

            return browser.runtime.sendMessage(options.extensionId, message, (result: any) => {
                clearTimeout(timeout);
                resolve(
                    browser.runtime.lastError
                        ? {
                              type: 'error',
                              error: browser.runtime.lastError.message,
                          }
                        : result
                );
            });
        }

        window.postMessage({ extension: options.extensionId, token, ...message }, '/');
        window.addEventListener('message', onFallbackMessage);
    });
};
