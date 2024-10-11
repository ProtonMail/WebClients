import type { ResumedSessionResult } from '../authentication/persistedSessionHelper';
import type { APP_NAMES } from '../constants';
import { SECOND } from '../constants';
import { createTimeoutError } from '../fetch/ApiError';
import { getIsDrawerPostMessage, postMessageFromIframe } from './helpers';
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
            reject(createTimeoutError({}));
        }, SECOND);
    });
};
