import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { type PersistedSession, SessionSource } from '../authentication/SessionInterface';
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
                const {
                    UID,
                    keyPassword = '',
                    User,
                    localID,
                    clientKey,
                    offlineKey,
                    persistent,
                    trusted,
                    tag,
                    // Backwards compatiblity while both apps are being updated
                    persistedSession: maybePersistedSession,
                } = event.data.payload;
                window.removeEventListener('message', handler);

                if (timeout) {
                    clearTimeout(timeout);
                }

                const persistedSession: PersistedSession = maybePersistedSession ?? {
                    // This is a mock of the persisted session since the drawer isn't fully using it anyway.
                    UID,
                    payloadType: 'default',
                    payloadVersion: 1,
                    localID,
                    UserID: User.ID,
                    accessType: AccessType.Self,
                    source: SessionSource.Proton,
                    persistent,
                    persistedAt: Date.now(),
                    trusted,
                };

                resolve({
                    tag,
                    UID,
                    keyPassword,
                    clientKey,
                    offlineKey,
                    User,
                    localID: localID ?? parentLocalID,
                    persistedSession,
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
