import { fetchController } from '@proton/pass/lib/api/fetch-controller';
import { asyncQueue } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { globToRegExp } from '@proton/pass/utils/url/glob';
import { wait } from '@proton/shared/lib/helpers/promise';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { getUID } from './utils';

const SERSSION_LOCK_ROUTES = globToRegExp('/api/pass/v1/user/session/lock/*');
export const matchLockRoute = (pathname: string): boolean => SERSSION_LOCK_ROUTES.test(pathname);

const sessionRouteLock = asyncQueue(
    async (event: FetchEvent, signal: AbortSignal) => {
        await wait(randomIntFromInterval(100, 500));
        return fetch(event.request, { signal });
    },
    { key: (event) => getUID(event)! }
);

export const handleLock = fetchController.register((event, signal) => {
    const UID = getUID(event);
    logger.info(`[ServiceWorker] Session lock request intercepted for UID[${UID}]`);
    if (UID) return sessionRouteLock(event, signal).then((res) => res.clone());
});
