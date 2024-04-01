import { fetchController, getUID } from '@proton/pass/lib/api/fetch-controller';
import { asyncLock, asyncQueue } from '@proton/pass/utils/fp/promises';
import { wait } from '@proton/shared/lib/helpers/promise';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export const requestLockFactory = () =>
    asyncLock(
        async (event: FetchEvent, signal: AbortSignal) => {
            await wait(randomIntFromInterval(250, 1_000));
            return fetchController.fetch(event.request, signal);
        },
        { key: (event) => getUID(event)! }
    );

export const requestQueueFactory = () =>
    asyncQueue(
        async (event: FetchEvent, signal: AbortSignal) => {
            await wait(randomIntFromInterval(250, 1_000));
            return fetchController.fetch(event.request, signal);
        },
        { key: (event) => getUID(event)! }
    );
