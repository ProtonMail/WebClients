import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ExtensionEndpoint, Maybe, RequiredNonNull, TabId, WorkerStatus } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';
import identity from '@proton/utils/identity';

import type { UserState } from '../../reducers';
import type { SynchronizationResult } from '../../sagas/workers/sync';
import * as requests from '../requests';
import withCacheBlock from '../with-cache-block';
import withNotification from '../with-notification';
import { type EndpointOptions, withReceiver } from '../with-receiver';
import withRequest from '../with-request';

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
            withRequest({ id: requests.wakeup(endpoint, tabId), type: 'start' })
        )({ payload })
);

export const wakeupSuccess = createAction('wakeup success', (endpoint: ExtensionEndpoint, tabId: TabId) =>
    pipe(
        withCacheBlock,
        withReceiver({ endpoint, tabId }),
        withRequest({ id: requests.wakeup(endpoint, tabId), type: 'success' })
    )({ payload: {} })
);

export const boot = createAction('boot', pipe(withCacheBlock, withRequest({ id: requests.boot(), type: 'start' })));

export const bootFailure = createAction('boot failure', (error: unknown) =>
    pipe(
        withCacheBlock,
        withRequest({ id: requests.boot(), type: 'failure' }),
        withNotification({
            type: 'error',
            text: c('Error').t`Unable to boot`,
            error,
        })
    )({ payload: {} })
);

export const bootSuccess = createAction(
    'boot success',
    (payload: RequiredNonNull<UserState> & { sync: Maybe<SynchronizationResult> }) =>
        pipe(
            withCacheBlock,
            withRequest({
                id: requests.boot(),
                type: 'success',
            })
        )({ payload })
);

export const syncIntent = createAction(
    'sync intent',
    pipe(
        withCacheBlock,
        withRequest({
            id: requests.syncing(),
            type: 'start',
        })
    )
);

export const syncSuccess = createAction('sync success', (payload: SynchronizationResult) =>
    pipe(
        withRequest({ id: requests.syncing(), type: 'success' }),
        withNotification({ type: 'info', text: c('Info').t`Successfully synced all vaults` })
    )({ payload })
);

export const syncFailure = createAction('sync failure', (error: unknown) =>
    pipe(
        withCacheBlock,
        withRequest({ id: requests.syncing(), type: 'failure' }),
        withNotification({
            type: 'error',
            text: c('Error').t`Unable to sync`,
            error,
        })
    )({ payload: {} })
);
