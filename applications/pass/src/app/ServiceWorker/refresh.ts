import { type AsyncLockedFunc, asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';

export type RefreshLock = () => Promise<Response>;
const refreshHandlers = new Map<string, AsyncLockedFunc<(event: FetchEvent) => Promise<Response>>>();

export const processRefresh = (event: FetchEvent) => {
    const requestHeaders = event.request.headers;
    const UID = requestHeaders.get('X-Pm-Uid');

    if (UID) {
        const handlerForUID = refreshHandlers.get(UID);
        const handler = handlerForUID ?? asyncLock(async (evt: FetchEvent) => wait(500).then(() => fetch(evt.request)));
        refreshHandlers.set(UID, handler);

        logger.info('[ServiceWorker] Refresh request intercepted');
        if (handler.getState().pending) logger.info('[ServiceWorker] Got concurrent refresh..');

        event.respondWith(handler(event).then((response) => response.clone()));
    }
};
