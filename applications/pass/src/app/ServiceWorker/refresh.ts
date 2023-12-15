import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { getUID } from './utils';

const refreshLock = asyncLock(
    async (event: FetchEvent) => {
        await wait(randomIntFromInterval(500, 1000));
        return fetch(event.request);
    },
    { key: (event) => getUID(event)! }
);

export const processRefresh = async (event: FetchEvent) => {
    const UID = getUID(event);
    logger.info(`[ServiceWorker] Refresh request intercepted for UID[${UID}]`);
    if (UID) event.respondWith(refreshLock(event).then((res) => res.clone()));
};
