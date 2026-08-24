import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import identity from '@proton/utils/identity';

import type { ReauthActionPayload } from '../../../lib/auth/reauth';
import type { SyncMigration, SyncResult } from '../../../lib/sync/types';
import type { AppStatus } from '../../../types';
import { pipe } from '../../../utils/fp/pipe';
import { or } from '../../../utils/fp/predicates';
import type { Chunk } from '../../../utils/object/chunk';
import { withRequest } from '../../request/enhancers';
import { requestActionsFactory } from '../../request/flow';
import { type CacheMeta, withCache, withCacheOptions } from '../enhancers/cache';
import { withStreamableAction } from '../enhancers/client';
import { type EndpointOptions, withReceiver } from '../enhancers/endpoint';
import { withItems } from '../enhancers/items';
import { withNotification } from '../enhancers/notification';
import { bootRequest, syncRequest } from '../requests';

export const startEventPolling = createAction('events::polling::start');
export const stopEventPolling = createAction('events::polling::stop');

export const stateDestroy = createAction('state::destroy');
export const stateHydrate = createAction('state::hydrate', (state: any, options?: EndpointOptions) =>
    pipe(withStreamableAction, options ? withReceiver(options) : identity)({ payload: { state } })
);

export const cacheRequest = createAction('cache::request', (options: Omit<CacheMeta, 'cache'>) =>
    withCacheOptions(options)({ payload: {} })
);

export const cacheCancel = createAction('cache::cancel');
export const cacheConflict = createAction('cache::conflict');

export const clientInit = requestActionsFactory<{ status: AppStatus } & EndpointOptions, EndpointOptions>('client::init')({
    key: ({ tabId, endpoint }: EndpointOptions) => `${endpoint}::${tabId}`,
    intent: { prepare: (payload) => withReceiver(payload)({ payload }) },
    success: { prepare: (payload) => withReceiver(payload)({ payload }) },
});

export const bootIntent = createAction('boot::intent', (payload?: { offline?: boolean; reauth?: ReauthActionPayload }) =>
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

export const bootSuccess = createAction('boot::success', (payload?: SyncResult) =>
    pipe(withRequest({ id: bootRequest(), status: 'success' }), withStreamableAction)({ payload })
);

export const syncIntent = createAction('sync::intent', () =>
    pipe(
        withRequest({ id: syncRequest(), status: 'start' }),
        withNotification({
            text: c('Info').t`Syncing your vaults…`,
            type: 'info',
            expiration: -1,
            showCloseButton: false,
            loading: true,
        })
    )({ payload: null })
);

export const syncSuccess = createAction('sync::success', (payload: SyncResult) =>
    pipe(
        withItems,
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

export const offlineResume = requestActionsFactory<{ localID?: number; retryable?: boolean; silence?: boolean }, boolean, void>(
    'offline::resume'
)();

export const syncResult = createAction('sync::result', (payload: SyncResult) => pipe(withCache, withStreamableAction)({ payload }));

/** Commits a sync strategy migration. Dispatched during boot. The strategy and
 * cursor persist via the post-boot cache flush (writes are gated until `booted`). */
export const syncMigration = createAction<SyncMigration>('sync::migration');

/** Represents an action object streamed through chunks.
 * This is only to be used in the extension when action
 * payloads may be too large for port/sendMessage messages */
export const actionStream = createAction('action::stream', (chunk: Chunk, options?: EndpointOptions) =>
    withReceiver(options ?? {})({ payload: { chunk } })
);

export const matchSyncAction = or(bootSuccess.match, syncSuccess.match, syncResult.match);
