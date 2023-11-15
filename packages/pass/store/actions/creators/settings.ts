import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest, { withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { ExtensionEndpoint, RecursivePartial } from '@proton/pass/types';
import { type CriteriaMasks } from '@proton/pass/types/worker/settings';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { settingsEditRequest } from '../requests';

export const settingsEditIntent = createAction(
    'settings::edit::intent',
    (group: string, payload: RecursivePartial<ProxiedSettings>) =>
        pipe(withRequest({ type: 'start', id: settingsEditRequest(group) }), withCacheBlock)({ payload })
);

export const settingsEditFailure = createAction(
    'settings::edit::failure',
    withRequestFailure((error: unknown, endpoint?: ExtensionEndpoint) =>
        pipe(
            withNotification({ type: 'error', text: c('Error').t`Settings update failed`, endpoint, error }),
            withCacheBlock
        )({ payload: {} })
    )
);

export const settingsEditSuccess = createAction(
    'settings::edit::success',
    withRequestSuccess((payload: RecursivePartial<ProxiedSettings>, endpoint?: ExtensionEndpoint) =>
        withNotification({ type: 'success', text: c('Info').t`Settings successfully updated`, endpoint })({
            payload,
        })
    )
);

export const updatePauseListItem = createAction(
    'settings::pause-list::update',
    (payload: { hostname: string; criteria: CriteriaMasks }) => ({ payload })
);

export const syncLocalSettings = createAction<RecursivePartial<ProxiedSettings>>('settings::local::sync');
