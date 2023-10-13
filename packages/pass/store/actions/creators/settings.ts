import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import withNotification from '@proton/pass/store/actions/with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { ExtensionEndpoint, RecursivePartial } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

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
