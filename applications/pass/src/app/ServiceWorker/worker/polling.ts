import { createNetworkError, getUID } from '@proton/pass/lib/api/fetch-controller';
import { globToRegExp } from '@proton/pass/lib/urls/utils/utils';
import { asyncLock } from '@proton/pass/utils/fp/promises';

import { fetchController } from './fetch-controller';

const EVENT_ROUTES = ['/api/pass/v1/share/*/event/*', '/api/pass/v1/invite', '/api/core/v4/events/*'].map(globToRegExp);

export const matchPollingRoute = (pathname: string): boolean => EVENT_ROUTES.some((route) => route.test(pathname));

export const handlePolling = fetchController.register(
    asyncLock(
        async (event: FetchEvent, signal: AbortSignal): Promise<Response> =>
            fetchController.fetch(event.request, signal).catch(() => createNetworkError()),
        { key: (event) => getUID(event) + event.request.url }
    )
);
