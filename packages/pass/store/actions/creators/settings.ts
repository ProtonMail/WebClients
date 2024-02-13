import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/enhancers/request';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import { settingsEditRequest } from '@proton/pass/store/actions/requests';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { ClientEndpoint, RecursivePartial } from '@proton/pass/types';
import { type CriteriaMasks } from '@proton/pass/types/worker/settings';
import { pipe } from '@proton/pass/utils/fp/pipe';
import identity from '@proton/utils/identity';

export const settingsEditIntent = createAction(
    'settings::edit::intent',
    (group: string, payload: RecursivePartial<ProxiedSettings>, silent: boolean = false) =>
        withRequest({ type: 'start', id: settingsEditRequest(group), data: { silent } })({ payload })
);

export const settingsEditFailure = createAction(
    'settings::edit::failure',
    withRequestFailure((error: unknown, endpoint?: ClientEndpoint) =>
        withNotification({ type: 'error', text: c('Error').t`Settings update failed`, endpoint, error })({
            payload: {},
        })
    )
);

export const settingsEditSuccess = createAction(
    'settings::edit::success',
    withRequestSuccess((payload: RecursivePartial<ProxiedSettings>, silent?: boolean, endpoint?: ClientEndpoint) =>
        pipe(
            withCache,
            withSettings,
            silent
                ? identity
                : withNotification({
                      type: 'success',
                      text: c('Info').t`Settings successfully updated`,
                      endpoint,
                  })
        )({ payload })
    )
);

export const updatePauseListItem = createAction(
    'settings::pause-list::update',
    (payload: { hostname: string; criteria: CriteriaMasks }) => pipe(withSettings, withCache)({ payload })
);

export const syncLocalSettings = createAction(
    'settings::local::sync',
    (payload: RecursivePartial<ProxiedSettings>) => ({ payload })
);
