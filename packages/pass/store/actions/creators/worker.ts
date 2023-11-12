import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { bootRequest, syncRequest, wakeupRequest } from '@proton/pass/store/actions/requests';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
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
 * refs. Do not cache block `stateSync` if it is for the background store */
export const stateSync = createAction('state::sync', (state: any, options?: EndpointOptions) =>
    pipe(
        options?.endpoint !== 'background' ? withCacheBlock : identity,
        withReceiver(options ?? {})
    )({ payload: { state } })
);

export const stateCache = createAction('state::cache');
export const stateLock = createAction('state::lock', () => withCacheBlock({ payload: {} }));
export const stateDestroy = createAction('state::destroy', () => withCacheBlock({ payload: {} }));

export const wakeupIntent = createAction(
    'wakeup::intent',
    (payload: { status: AppStatus }, receiver: EndpointOptions) =>
        pipe(
            withCacheBlock,
            withReceiver(receiver),
            withRequest({ id: wakeupRequest(receiver), type: 'start' })
        )({ payload })
);

export const wakeupSuccess = createAction(
    'wakeup::success',
    withRequestSuccess((receiver: EndpointOptions) => pipe(withCacheBlock, withReceiver(receiver))({ payload: {} }))
);

export const bootIntent = createAction(
    'boot::intent',
    pipe(withCacheBlock, withRequest({ id: bootRequest(), type: 'start' }))
);

export const bootFailure = createAction(
    'boot::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({ type: 'error', text: c('Error').t`Unable to boot`, error })
        )({ payload: {} })
    )
);

export const bootSuccess = createAction(
    'boot::success',
    withRequestSuccess((payload: { userState: SafeUserState; sync: Maybe<SynchronizationResult> }) =>
        withCacheBlock({ payload })
    )
);

export const syncIntent = createAction('sync::intent', () =>
    pipe(withCacheBlock, withRequest({ id: syncRequest(), type: 'start' }))({ payload: {} })
);

export const syncSuccess = createAction(
    'sync::success',
    withRequestSuccess((payload: SynchronizationResult) =>
        withNotification({ type: 'info', text: c('Info').t`Successfully synced all vaults` })({ payload })
    )
);

export const syncFailure = createAction(
    'sync::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({ type: 'error', text: c('Error').t`Unable to sync`, error })
        )({ payload: {} })
    )
);
