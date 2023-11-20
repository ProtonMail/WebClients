import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { bootRequest, syncRequest, wakeupRequest } from '@proton/pass/store/actions/requests';
import { withCache } from '@proton/pass/store/actions/with-cache';
import withNotification from '@proton/pass/store/actions/with-notification';
import type { EndpointOptions } from '@proton/pass/store/actions/with-receiver';
import { withReceiver } from '@proton/pass/store/actions/with-receiver';
import withRequest, { withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { SafeUserState } from '@proton/pass/store/reducers';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import type { AppStatus, Maybe } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import identity from '@proton/utils/identity';

export const startEventPolling = createAction('events::polling::start');
export const stopEventPolling = createAction('events::polling::stop');

/* ⚠️ do not cast payload::cache to type `State` in order to avoid circular type
 * refs. Only cache `stateSync` if it is for the background store */
export const stateSync = createAction('state::sync', (state: any, options?: EndpointOptions) =>
    pipe(options?.endpoint === 'background' ? withCache : identity, withReceiver(options ?? {}))({ payload: { state } })
);

export const cacheRequest = createAction('cache::request', () => withCache({ payload: {} }));
export const cacheCancel = createAction('cache::cancel');

export const stateDestroy = createAction('state::destroy');

export const wakeupIntent = createAction(
    'wakeup::intent',
    (payload: { status: AppStatus }, receiver: EndpointOptions) =>
        pipe(withReceiver(receiver), withRequest({ id: wakeupRequest(receiver), type: 'start' }))({ payload })
);

export const wakeupSuccess = createAction(
    'wakeup::success',
    withRequestSuccess((receiver: EndpointOptions) => withReceiver(receiver)({ payload: {} }))
);

export const bootIntent = createAction('boot::intent', () =>
    withRequest({ id: bootRequest(), type: 'start' })({ payload: {} })
);

export const bootFailure = createAction('boot::failure', (error: unknown) =>
    pipe(
        withRequest({ id: bootRequest(), type: 'failure' }),
        withNotification({ type: 'error', text: c('Error').t`Unable to boot`, error })
    )({ payload: {}, error })
);

export const bootSuccess = createAction(
    'boot::success',
    (payload: { userState: SafeUserState; sync: Maybe<SynchronizationResult> }) =>
        pipe(withCache, withRequest({ id: bootRequest(), type: 'success' }))({ payload })
);

export const syncIntent = createAction('sync::intent', () =>
    withRequest({ id: syncRequest(), type: 'start' })({ payload: {} })
);

export const syncSuccess = createAction(
    'sync::success',
    withRequestSuccess((payload: SynchronizationResult) =>
        pipe(
            withCache,
            withNotification({ type: 'info', text: c('Info').t`Successfully synced all vaults` })
        )({ payload })
    )
);

export const syncFailure = createAction(
    'sync::failure',
    withRequestFailure((error: unknown) =>
        withNotification({ type: 'error', text: c('Error').t`Unable to sync`, error })({ payload: {} })
    )
);
