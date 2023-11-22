import { type AsyncLockedFunc, asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';

const REFRESH_HANDLERS = new Map<string, AsyncLockedFunc<(event: FetchEvent) => Promise<Response>>>();

export const processRefresh = (event: FetchEvent) => {
    const requestHeaders = event.request.headers;
    const UID = requestHeaders.get('X-Pm-Uid');

    if (UID) {
        const handlerForUID = REFRESH_HANDLERS.get(UID);
        const handler = handlerForUID ?? asyncLock(async (evt: FetchEvent) => wait(500).then(() => fetch(evt.request)));
        REFRESH_HANDLERS.set(UID, handler);

        logger.info('[ServiceWorker] Refresh request intercepted');
        event.respondWith(handler(event).then((response) => response.clone()));
    }
};
