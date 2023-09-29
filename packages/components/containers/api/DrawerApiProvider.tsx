import { ReactNode } from 'react';

import { updateServerTime } from '@proton/crypto';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APP_NAMES, DEFAULT_TIMEOUT } from '@proton/shared/lib/constants';
import { getIsAuthorizedApp, getIsDrawerPostMessage, postMessageFromIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { deserializeApiErrorData } from '@proton/shared/lib/fetch/ApiError';
import noop from '@proton/utils/noop';

import { generateUID } from '../../helpers';
import { useConfig } from '../../hooks';
import ApiContext from './apiContext';

const DrawerApiProvider = ({ children }: { children: ReactNode }) => {
    const { APP_VERSION } = useConfig();
    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const handleIframeApi = (arg: any) => {
        const id = generateUID();
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

                if (success) {
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
            const hasAbortController = 'signal' in arg;

            const newArg: any = { ...arg };
            if (hasAbortController) {
                delete newArg.signal;
                (arg.signal as AbortSignal).onabort = () => {
                    postMessageFromIframe(
                        {
                            type: DRAWER_EVENTS.ABORT_REQUEST,
                            payload: { id },
                        },
                        parentApp as APP_NAMES
                    );
                };
            }
            postMessageFromIframe(
                {
                    type: DRAWER_EVENTS.API_REQUEST,
                    payload: { arg: newArg, id, appVersion: APP_VERSION, hasAbortController },
                },
                parentApp
            );
            window.addEventListener('message', handler);

            // Resolve the promise if the parent app does not respond
            timeout = setTimeout(() => {
                resolve(undefined);
            }, DEFAULT_TIMEOUT);
        }

        return promise;
    };

    return <ApiContext.Provider value={handleIframeApi}>{children}</ApiContext.Provider>;
};

export default DrawerApiProvider;
