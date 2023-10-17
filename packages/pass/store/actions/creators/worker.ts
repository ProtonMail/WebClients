import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { bootRequest, syncRequest, wakeupRequest } from '@proton/pass/store/actions/requests';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import withNotification from '@proton/pass/store/actions/with-notification';
import type { EndpointOptions } from '@proton/pass/store/actions/with-receiver';
import { withReceiver } from '@proton/pass/store/actions/with-receiver';
import withRequest from '@proton/pass/store/actions/with-request';
import type { SafeUserState } from '@proton/pass/store/reducers';
import type { SynchronizationResult } from '@proton/pass/store/sagas/workers/sync';
import type { ExtensionEndpoint, Maybe, TabId, WorkerStatus } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import identity from '@proton/utils/identity';

export const startEventPolling = createAction('events::polling::start');
export const stopEventPolling = createAction('events::polling::stop');

/**
 * do not cast payload::cache to type `State`
 * in order to avoid circular type refs
 * Do not cache block `stateSync` if it is
 * for the background store
 */
export const stateSync = createAction('state sync', (state: any, options?: EndpointOptions) =>
    pipe(
        options?.endpoint !== 'background' ? withCacheBlock : identity,
        withReceiver(options ?? {})
    )({ payload: { state } })
);

export const stateCache = createAction('state cache');
export const stateLock = createAction('state lock', () => withCacheBlock({ payload: {} }));
export const stateDestroy = createAction('state destroy', () => withCacheBlock({ payload: {} }));

export const wakeup = createAction(
    'wakeup',
    (payload: { status: WorkerStatus }, endpoint: ExtensionEndpoint, tabId: TabId) =>
        pipe(
            withCacheBlock,
            withReceiver({ endpoint, tabId }),
            withRequest({ id: wakeupRequest(endpoint, tabId), type: 'start' })
        )({ payload })
);

export const wakeupSuccess = createAction('wakeup success', (endpoint: ExtensionEndpoint, tabId: TabId) =>
    pipe(
        withCacheBlock,
        withReceiver({ endpoint, tabId }),
        withRequest({ id: wakeupRequest(endpoint, tabId), type: 'success' })
    )({ payload: {} })
);

export const boot = createAction('boot', pipe(withCacheBlock, withRequest({ id: bootRequest(), type: 'start' })));

export const bootFailure = createAction('boot failure', (error: unknown) =>
    pipe(
        withCacheBlock,
        withRequest({ id: bootRequest(), type: 'failure' }),
        withNotification({
            type: 'error',
            text: c('Error').t`Unable to boot`,
            error,
        })
    )({ payload: {} })
);

export const bootSuccess = createAction(
    'boot success',
    (payload: { userState: SafeUserState; sync: Maybe<SynchronizationResult> }) =>
        pipe(
            withCacheBlock,
            withRequest({
                id: bootRequest(),
                type: 'success',
            })
        )({ payload })
);

export const syncIntent = createAction(
    'sync intent',
    pipe(
        withCacheBlock,
        withRequest({
            id: syncRequest(),
            type: 'start',
        })
    )
);

export const syncSuccess = createAction('sync success', (payload: SynchronizationResult) =>
    pipe(
        withRequest({ id: syncRequest(), type: 'success' }),
        withNotification({ type: 'info', text: c('Info').t`Successfully synced all vaults` })
    )({ payload })
);

export const syncFailure = createAction('sync failure', (error: unknown) =>
    pipe(
        withCacheBlock,
        withRequest({ id: syncRequest(), type: 'failure' }),
        withNotification({
            type: 'error',
            text: c('Error').t`Unable to sync`,
            error,
        })
    )({ payload: {} })
);
