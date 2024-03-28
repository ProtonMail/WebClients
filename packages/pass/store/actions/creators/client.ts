import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type CacheMeta, withCache, withCacheOptions } from '@proton/pass/store/actions/enhancers/cache';
import { type EndpointOptions, withReceiver } from '@proton/pass/store/actions/enhancers/endpoint';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withRequest, withRequestSuccess } from '@proton/pass/store/actions/enhancers/request';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import { bootRequest, syncRequest, wakeupRequest } from '@proton/pass/store/actions/requests';
import type { SyncType, SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import type { AppStatus } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const startEventPolling = createAction('events::polling::start');
export const stopEventPolling = createAction('events::polling::stop');

export const stateDestroy = createAction('state::destroy');
export const stateSync = createAction('state::sync');
export const stateHydrate = createAction('state::hydrate', (state: any, options?: EndpointOptions) =>
    options ? withReceiver(options)({ payload: { state } }) : { payload: { state } }
);

export const cacheRequest = createAction('cache::request', (options: Omit<CacheMeta, 'cache'>) =>
    withCacheOptions(options)({ payload: {} })
);

export const cacheCancel = createAction('cache::cancel');

export const wakeupIntent = createAction(
    'wakeup::intent',
    (payload: { status: AppStatus }, receiver: EndpointOptions) =>
        pipe(withReceiver(receiver), withRequest({ id: wakeupRequest(receiver), type: 'start' }))({ payload })
);

export const wakeupSuccess = createAction(
    'wakeup::success',
    withRequestSuccess((receiver: EndpointOptions) => withReceiver(receiver)({ payload: {} }))
);

export const bootIntent = createAction('boot::intent', (loginPassword?: string) =>
    withRequest({ id: bootRequest(), type: 'start' })({ payload: { loginPassword } })
);

export const bootFailure = createAction('boot::failure', (error: unknown) =>
    pipe(
        withRequest({ id: bootRequest(), type: 'failure' }),
        withNotification({ type: 'error', text: c('Error').t`Unable to boot`, error })
    )({ payload: {}, error })
);

export const bootSuccess = createAction('boot::success', (payload?: SynchronizationResult) =>
    pipe(withRequest({ id: bootRequest(), type: 'success' }), withSettings)({ payload })
);

export const syncIntent = createAction('sync::intent', (type: SyncType) =>
    pipe(
        withRequest({ id: syncRequest(), type: 'start' }),
        withNotification({
            text: c('Info').t`Syncing your vaults…`,
            type: 'info',
            expiration: -1,
            showCloseButton: false,
            loading: true,
        })
    )({ payload: { type } })
);

export const syncSuccess = createAction('sync::success', (payload: SynchronizationResult) =>
    pipe(
        withCache,
        withRequest({ id: syncRequest(), type: 'success' }),
        withNotification({ type: 'info', text: c('Info').t`Successfully synced all vaults` })
    )({ payload })
);

export const syncFailure = createAction('sync::failure', (error: unknown) =>
    pipe(
        withRequest({ id: syncRequest(), type: 'failure' }),
        withNotification({ type: 'error', text: c('Error').t`Unable to sync`, error })
    )({ payload: {} })
);

export const offlineResume = createAction('offline::resume', (localID?: number) => ({ payload: { localID } }));
