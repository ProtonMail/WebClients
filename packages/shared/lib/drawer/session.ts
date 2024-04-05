import { updateVersionCookie, versionCookieAtLoad } from '@proton/components/hooks/useEarlyAccess';

import { ResumedSessionResult } from '../authentication/persistedSessionHelper';
import { APP_NAMES, SECOND } from '../constants';
import { createTimeoutError } from '../fetch/ApiError';
import { getIsDrawerPostMessage, postMessageFromIframe } from './helpers';
import { DRAWER_EVENTS } from './interfaces';

export const resumeSessionDrawerApp = ({
    parentApp,
    localID: parentLocalID,
}: {
    parentApp: APP_NAMES;
    localID: number;
}) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return new Promise<ResumedSessionResult>((resolve, reject) => {
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

                // When opening the drawer, we might need to set the tag of the app we are opening
                // Otherwise we will not open the correct version of the app (default instead of beta or alpha)
                if (tag && versionCookieAtLoad !== tag) {
                    updateVersionCookie(tag, undefined);
                    window.location.reload();
                } else {
                    resolve({
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
