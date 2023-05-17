export type ExtensionMessage<T = {}> = { type: string } & T;
export type ExtensionMessageType<M extends ExtensionMessage = ExtensionMessage> = `${M['type']}`;

/* extension communicating with account should
 * conform to this message response type */
export type ExtensionMessageResponse<P extends {}> =
    | { type: 'success'; payload: P }
    | { type: 'error'; payload?: P; error?: string };

/* message fallback should contain the initial message's
 * type as a property in order to ensure we're dealing
 * with the appropriate response message */
export type ExtensionMessageFallbackResponse<T extends ExtensionMessage, P extends {}> = {
    [K in T['type']]: string;
} & ExtensionMessageResponse<P>;

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
        onFallbackMessage?: (
            event: MessageEvent<ExtensionMessageFallbackResponse<T, any>>
        ) => ExtensionMessageResponse<R> | undefined;
    }
): Promise<ExtensionMessageResponse<R>> => {
    let timeout: NodeJS.Timeout;

    return new Promise<ExtensionMessageResponse<R>>((resolve) => {
        /* in order to support legacy message formats : allow
         * intercepting event via `options.onFallbackMessage` */
        const onFallbackMessage = (event: MessageEvent<ExtensionMessageFallbackResponse<T, R>>) => {
            if (event.source === window && message.type in event.data) {
                clearTimeout(timeout);
                window.removeEventListener('message', onFallbackMessage);
                resolve(options?.onFallbackMessage?.(event) ?? event.data);
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

        window.addEventListener('message', onFallbackMessage);
        window.postMessage({ extension: options.extensionId, ...message }, '/');
    });
};
