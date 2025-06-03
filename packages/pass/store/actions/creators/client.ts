import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ReauthActionPayload } from '@proton/pass/lib/auth/reauth';
import { type CacheMeta, withCache, withCacheOptions } from '@proton/pass/store/actions/enhancers/cache';
import { withStreamableAction } from '@proton/pass/store/actions/enhancers/client';
import { type EndpointOptions, withReceiver } from '@proton/pass/store/actions/enhancers/endpoint';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { bootRequest, syncRequest } from '@proton/pass/store/actions/requests';
import { withRequest } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { SyncType, SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import type { AppStatus } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import type { Chunk } from '@proton/pass/utils/object/chunk';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import identity from '@proton/utils/identity';

export const startEventPolling = createAction('events::polling::start');
export const stopEventPolling = createAction('events::polling::stop');

export const stateDestroy = createAction('state::destroy');
export const stateHydrate = createAction('state::hydrate', (state: any, options?: EndpointOptions) =>
    pipe(
        withStreamableAction,
        options ? withReceiver(options) : identity
    )({
        payload: { state },
    })
);

export const cacheRequest = createAction('cache::request', (options: Omit<CacheMeta, 'cache'>) =>
    withCacheOptions(options)({ payload: {} })
);

export const cacheCancel = createAction('cache::cancel');

export const clientInit = requestActionsFactory<{ status: AppStatus } & EndpointOptions, EndpointOptions>(
    'client::init'
)({
    key: ({ tabId, endpoint }: EndpointOptions) => `${endpoint}::${tabId}`,
    intent: { prepare: (payload) => withReceiver(payload)({ payload }) },
    success: { prepare: (payload) => withReceiver(payload)({ payload }) },
});

export const bootIntent = createAction(
    'boot::intent',
    (payload?: { offline?: boolean; reauth?: ReauthActionPayload }) =>
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
    pipe(withRequest({ id: bootRequest(), status: 'success' }), withStreamableAction)({ payload })
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
        withStreamableAction,
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

export const offlineResume = requestActionsFactory<{ localID?: number }, void, void>('offline::resume')();

/** Represents an action object streamed through chunks.
 * This is only to be used in the extension when action
 * payloads may be too large for port/sendMessage messages */
export const actionStream = createAction('action::stream', (chunk: Chunk, options?: EndpointOptions) =>
    withReceiver(options ?? {})({ payload: { chunk } })
);
