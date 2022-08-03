import { ReactNode } from 'react';

import { updateServerTime } from '@proton/crypto';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APP_NAMES, DEFAULT_TIMEOUT } from '@proton/shared/lib/constants';
import { getIsAuthorizedApp, postMessageFromIframe } from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_ACTION, SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';
import noop from '@proton/utils/noop';

import { generateUID } from '../../helpers';
import ApiContext from './apiContext';

const SideAppApiProvider = ({ children }: { children: ReactNode }) => {
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

        const handler = (event: MessageEvent<SIDE_APP_ACTION>) => {
            if (event.data.type === SIDE_APP_EVENTS.SIDE_APP_API_RESPONSE && event.data.payload.id === id) {
                const { serverTime, data, success } = event.data.payload;

                window.removeEventListener('message', handler);
                if (timeout) {
                    clearTimeout(timeout);
                }

                updateServerTime(serverTime);

                if (success) {
                    resolve(data);
                } else {
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
                            type: SIDE_APP_EVENTS.SIDE_APP_ABORT_REQUEST,
                            payload: { id },
                        },
                        parentApp as APP_NAMES
                    );
                };
            }
            postMessageFromIframe(
                { type: SIDE_APP_EVENTS.SIDE_APP_API_REQUEST, payload: { arg: newArg, id, hasAbortController } },
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

export default SideAppApiProvider;
