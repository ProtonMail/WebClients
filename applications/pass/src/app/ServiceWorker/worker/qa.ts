import { createNetworkError, getUID } from '@proton/pass/lib/api/fetch-controller';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { globToRegExp } from '@proton/pass/utils/url/utils';
import { wait } from '@proton/shared/lib/helpers/promise';

import { fetchController } from './fetch-controller';

const API_ROUTE = globToRegExp('/api/*');

export const matchAPIRoute = (pathname: string): boolean => API_ROUTE.test(pathname);

export const simulateDownTime = fetchController.register(
    asyncLock(
        async (_evt: FetchEvent, _signal: AbortSignal): Promise<Response> => {
            await wait(Math.random() * 1000);
            return createNetworkError(503);
        },
        { key: (event) => getUID(event) + event.request.url }
    )
);
