import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import type { ResumedSessionResult } from '../authentication/persistedSessionHelper';
import type { APP_NAMES } from '../constants';
import { SECOND } from '../constants';
import { createTimeoutError } from '../fetch/ApiError';
import { getIsAuthorizedApp, getIsDrawerPostMessage, postMessageFromIframe } from './helpers';
import { DRAWER_EVENTS, type SESSION_MESSAGE } from './interfaces';

export const resumeSessionDrawerApp = ({
    parentApp,
    localID: parentLocalID,
}: {
    parentApp: APP_NAMES;
    localID: number;
}) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return new Promise<ResumedSessionResult & { tag: SESSION_MESSAGE['payload']['tag'] }>((resolve, reject) => {
        const handler = (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            if (event.data.type === DRAWER_EVENTS.SESSION) {
                const { UID, keyPassword, User, localID, clientKey, offlineKey, persistent, trusted, tag } =
                    event.data.payload;
                window.removeEventListener('message', handler);

                if (timeout) {
                    clearTimeout(timeout);
                }

                resolve({
                    tag,
                    UID,
                    keyPassword,
                    clientKey,
                    offlineKey,
                    User,
                    persistent,
                    trusted,
                    LocalID: localID ?? parentLocalID,
                });
            }
        };

        postMessageFromIframe({ type: DRAWER_EVENTS.READY }, parentApp);
        window.addEventListener('message', handler);

        // Resolve the promise if the parent app does not respond
        timeout = setTimeout(() => {
            captureMessage('Drawer iframe session timeout', {
                level: 'info',
                extra: {
                    parentApp,
                    isAuthorizedApp: getIsAuthorizedApp(parentApp || ''),
                    locationOrigin: window.location.origin,
                    locationHref: window.location.href,
                },
            });

            reject(createTimeoutError({}));
        }, 10 * SECOND);
    });
};
