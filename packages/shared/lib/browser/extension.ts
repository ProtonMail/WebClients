import { c } from 'ttag';

import getRandomString from '@proton/utils/getRandomString';
import lastItem from '@proton/utils/lastItem';

import type { ExtensionForkPayload } from '../authentication/fork/extension';
import { APPS, BRAND_NAME, EXTENSIONS } from '../constants';
import { browserAPI, isChromiumBased, isSafari } from '../helpers/browser';

export type ExtensionForkMessage = { type: 'fork'; payload: ExtensionForkPayload };
export type ExtensionAuthenticatedMessage = { type: 'auth-ext' };
export type PassInstalledMessage = { type: 'pass-installed' };
export type PassOnboardingMessage = { type: 'pass-onboarding' };

export type ExtensionMessage =
    | ExtensionForkMessage
    | ExtensionAuthenticatedMessage
    | PassInstalledMessage
    | PassOnboardingMessage;

export type ExtensionApp = keyof typeof EXTENSIONS;

/* extension communicating with account should
 * conform to this message response type */
export type ExtensionMessageResponse<P = any> =
    | { type: 'success'; payload: P }
    | { type: 'error'; payload?: P; error?: string };

export type ExtensionMessageFallbackResponse<P = any> = ExtensionMessageResponse<P> & {
    token: string;
};

export const sendMessageSupported = () =>
    (isChromiumBased() || isSafari()) && browserAPI?.runtime?.sendMessage !== undefined;

const isValidExtensionResponse = <R = any>(response: any): response is ExtensionMessageResponse<R> =>
    response?.type === 'success' || response?.type === 'error';

type SendMessageResult = { ok: boolean; response: ExtensionMessageResponse };

const getExtensionErrorMessage = (): string => {
    const contents = [c('Warning').t`Please check that the extension is properly installed and enabled`];

    if (isSafari()) {
        contents.push(
            c('Info')
                .t`Open your Safari settings for the extension and verify site permissions are enabled for ${BRAND_NAME} domains`
        );
    }

    return contents.join(' - ');
};

const sendMessage = async (extensionId: string, message: any): Promise<SendMessageResult> => {
    const onError = (error?: string): SendMessageResult => ({
        ok: false,
        response: {
            type: 'error',
            error: error ?? getExtensionErrorMessage(),
        },
    });

    const onResponse = (response: unknown): SendMessageResult => {
        if (browserAPI.runtime.lastError || response === undefined) {
            return onError();
        }

        if (!isValidExtensionResponse(response)) {
            return {
                ok: true,
                response: {
                    type: 'error',
                    error: c('Warning').t`Please update the extension to its latest version`,
                },
            };
        }

        return { ok: true, response };
    };

    return new Promise<unknown>((resolve) => browserAPI.runtime.sendMessage(extensionId, message, resolve))
        .then(onResponse)
        .catch(() => onError());
};

/** When dealing with extensions residing in multiple stores, it's essential to handle
 * all possible extensionIds when dispatching a message. In this scenario, the first
 * extension to respond takes precedence. The messages are dispatched sequentially
 * to ensure accurate `lastError` checking. If no extensions respond, last runtime
 * error will be returned. This broadcasting mechanism only works for extensions and
 * browsers supporting the `externally_connectable` API. */
const broadcastMessage = async (
    extensionIds: readonly string[],
    message: ExtensionMessage
): Promise<ExtensionMessageResponse> => {
    /* Iterate until we have a successful link with one of the extensionIds. If establishing
     * connection with all of the extensionIds failed, returns the last failure response. */
    const results = await Promise.all(extensionIds.map((extensionId) => sendMessage(extensionId, message)));

    return results.find(({ ok }) => ok)?.response ?? lastItem(results)?.response ?? { type: 'error' };
};

/** Extension messaging must account for Chrome & Firefox specifics :
 * Chrome : we can leverage the `externally_connectable` permissions
 * Firefox : we have to result to fallback postMessaging via content
 * script injections */
export const sendExtensionMessage = async <R = any>(
    message: ExtensionMessage,
    options: { app: ExtensionApp; maxTimeout?: number }
): Promise<ExtensionMessageResponse<R>> => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const extension = EXTENSIONS[options.app];
    const token = getRandomString(16);

    return new Promise<ExtensionMessageResponse<R>>((resolve) => {
        const onFallbackMessage = ({ data, source }: MessageEvent) => {
            if (source === window && data?.from !== APPS.PROTONACCOUNT && data?.token === token) {
                clearTimeout(timeout);
                window.removeEventListener('message', onFallbackMessage);
                resolve(isValidExtensionResponse(data) ? data : { type: 'error', error: 'Bad format' });
            }
        };

        timeout = setTimeout(() => {
            window.removeEventListener('message', onFallbackMessage);
            resolve({ type: 'error', error: 'Extension timed out' });
        }, options.maxTimeout ?? 15_000);

        if (sendMessageSupported()) {
            return broadcastMessage(extension.IDs, message).then((result) => {
                clearTimeout(timeout);
                resolve(result);
            });
        }

        /* Firefox extensions should prefer checking the `message.data.app` property.
         * `message.data.extension` is kept for backward compatibility but will
         * be deprecated in the future */
        window.postMessage(
            {
                app: options.app,
                extension: extension.IDs[0],
                from: APPS.PROTONACCOUNT,
                token,
                ...message,
            },
            '/'
        );

        window.addEventListener('message', onFallbackMessage);
    });
};
