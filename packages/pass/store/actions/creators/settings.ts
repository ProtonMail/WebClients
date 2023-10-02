import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ExtensionEndpoint, RecursivePartial } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';

import type { ProxiedSettings } from '../../reducers/settings';
import withCacheBlock from '../with-cache-block';
import withNotification from '../with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '../with-request';

export const settingsEditIntent = createAction(
    'settings::edit::intent',
    withRequestStart((payload: RecursivePartial<ProxiedSettings>) => withCacheBlock({ payload }))
);

export const settingsEditFailure = createAction(
    'settings::edit::failure',
    withRequestFailure((error: unknown, receiver?: ExtensionEndpoint) =>
        pipe(
            withNotification({ type: 'error', text: c('Error').t`Settings update failed`, receiver, error }),
            withCacheBlock
        )({ payload: {} })
    )
);

export const settingsEditSuccess = createAction(
    'settings::edit::success',
    withRequestSuccess((payload: RecursivePartial<ProxiedSettings>, receiver?: ExtensionEndpoint) =>
        withNotification({ type: 'success', text: c('Info').t`Settings successfully updated`, receiver })({ payload })
    )
);

export const syncLocalSettings = createAction<RecursivePartial<ProxiedSettings>>('settings::local::sync');
