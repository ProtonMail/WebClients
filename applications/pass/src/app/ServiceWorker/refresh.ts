import { fetchController } from '@proton/pass/lib/api/fetch-controller';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { getUID } from './utils';

const REFRESH_PATH = '/api/auth/refresh';
export const matchRefreshRoute = (pathname: string): boolean => pathname === REFRESH_PATH;

const refreshLock = asyncLock(
    async (event: FetchEvent, signal: AbortSignal) => {
        await wait(randomIntFromInterval(500, 1000));
        return fetch(event.request, { signal });
    },
    { key: (event) => getUID(event)! }
);

export const handleRefresh = fetchController.register((event, signal) => {
    const UID = getUID(event);
    logger.info(`[ServiceWorker] Refresh request intercepted for UID[${UID}]`);
    if (UID) return refreshLock(event, signal).then((res) => res.clone());
});
