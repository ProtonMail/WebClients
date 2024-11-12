import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type CacheMeta, withCache, withCacheOptions } from '@proton/pass/store/actions/enhancers/cache';
import { type EndpointOptions, withReceiver } from '@proton/pass/store/actions/enhancers/endpoint';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import { bootRequest, syncRequest, wakeupRequest } from '@proton/pass/store/actions/requests';
import { withRequest, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { SyncType, SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import type { AppStatus } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import identity from '@proton/utils/identity';

export const startEventPolling = createAction('events::polling::start');
export const stopEventPolling = createAction('events::polling::stop');

export const stateDestroy = createAction('state::destroy');
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
        pipe(withReceiver(receiver), withRequest({ id: wakeupRequest(receiver), status: 'start' }))({ payload })
);

export const wakeupSuccess = createAction(
    'wakeup::success',
    withRequestSuccess((receiver: EndpointOptions) => withReceiver(receiver)({ payload: {} }))
);

export const bootIntent = createAction('boot::intent', (payload?: { offline: boolean }) =>
    withRequest({ id: bootRequest(), status: 'start' })({ payload })
);

export const bootFailure = createAction('boot::failure', (error?: unknown) =>
    pipe(
        withRequest({ id: bootRequest(), status: 'failure' }),
        error
            ? withNotification({
                  type: 'error',
                  text: c('Error')
                      .t`We encountered an issue while starting ${PASS_SHORT_APP_NAME}. If this problem continues, please contact our customer support for assistance.`,
                  error,
              })
            : identity
    )({ payload: {}, error })
);

export const bootSuccess = createAction('boot::success', (payload?: SynchronizationResult) =>
    pipe(withRequest({ id: bootRequest(), status: 'success' }), withSettings)({ payload })
);

export const syncIntent = createAction('sync::intent', (type: SyncType) =>
    pipe(
        withRequest({ id: syncRequest(), status: 'start' }),
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
        withRequest({ id: syncRequest(), status: 'success' }),
        withNotification({ type: 'info', text: c('Info').t`Successfully synced all vaults` })
    )({ payload })
);

export const syncFailure = createAction('sync::failure', (error: unknown) =>
    pipe(
        withRequest({ id: syncRequest(), status: 'failure' }),
        withNotification({ type: 'error', text: c('Error').t`Unable to sync`, error })
    )({ payload: {} })
);

export const offlineResume = requestActionsFactory<{ localID?: number }, void>('offline::resume')();
