import { updateServerTime } from '@proton/crypto';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import noop from '@proton/utils/noop';

import type { APP_NAMES } from '../constants';
import { DEFAULT_TIMEOUT } from '../constants';
import { createTimeoutError, deserializeApiErrorData } from '../fetch/ApiError';
import { getIsAuthorizedApp, getIsDrawerPostMessage, postMessageFromIframe } from './helpers';
import { DRAWER_EVENTS } from './interfaces';

export const createDrawerApi = ({
    parentApp,
    appVersion,
}: {
    parentApp: APP_NAMES | undefined;
    appVersion: string;
}): ApiWithListener => {
    let n = 1;

    const callback = (arg: any) => {
        const id = `${n++}`;
        let timeout: ReturnType<typeof setTimeout> | undefined;

        let resolve: (arg: any) => void = noop;
        let reject: (error: any) => void = noop;
        const promise = new Promise<any>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        const handler = (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            if (event.data.type === DRAWER_EVENTS.API_RESPONSE && event.data.payload.id === id) {
                const { output, serverTime, data, success, isApiError } = event.data.payload;

                window.removeEventListener('message', handler);
                if (timeout) {
                    clearTimeout(timeout);
                }

                updateServerTime(serverTime);

                if (success && data) {
                    if (output === 'raw') {
                        resolve({ ...data, headers: new Headers(data.headers), json: async () => data.json });
                    } else {
                        resolve(data);
                    }
                } else {
                    if (isApiError) {
                        reject(deserializeApiErrorData(data));
                    }
                    reject(data);
                }
            }
        };

        if (parentApp && getIsAuthorizedApp(parentApp)) {
            let hasAbortController = false;
            const newArg: any = { ...arg };
            if (arg?.signal) {
                hasAbortController = true;
                (arg.signal as AbortSignal).onabort = () => {
                    postMessageFromIframe(
                        {
                            type: DRAWER_EVENTS.ABORT_REQUEST,
                            payload: { id },
                        },
                        parentApp as APP_NAMES
                    );
                };
                delete newArg.signal;
            }
            postMessageFromIframe(
                {
                    type: DRAWER_EVENTS.API_REQUEST,
                    payload: { arg: newArg, id, appVersion, hasAbortController },
                },
                parentApp
            );
            window.addEventListener('message', handler);

            // Reject the promise if the parent app does not respond
            timeout = setTimeout(() => {
                reject(createTimeoutError({}));
            }, DEFAULT_TIMEOUT);
        }

        return promise;
    };

    Object.defineProperties(callback, {
        UID: {
            set() {},
        },
    });

    return Object.assign(callback as ApiWithListener, {
        addEventListener: () => {},
        removeEventListener: () => {},
    });
};
