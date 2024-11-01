import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import { settingsEditRequest } from '@proton/pass/store/actions/requests';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { ClientEndpoint, RecursivePartial } from '@proton/pass/types';
import type { CriteriaMasks, OfflineModeDTO } from '@proton/pass/types/worker/settings';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import identity from '@proton/utils/identity';

export const settingsEditIntent = createAction(
    'settings::edit::intent',
    (group: string, payload: RecursivePartial<ProxiedSettings>, silent: boolean = false) =>
        withRequest({ status: 'start', id: settingsEditRequest(group) })({ payload, meta: { silent } })
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

export const offlineToggle = requestActionsFactory<OfflineModeDTO, boolean, boolean>('offline::toggle')({
    intent: {
        prepare: (payload) =>
            withNotification({
                loading: true,
                text: payload.enabled ? c('Info').t`Enabling offline mode...` : c('Info').t`Disabling offline mode...`,
                type: 'info',
            })({ payload }),
    },
    success: {
        prepare: (enabled) =>
            pipe(
                withCache,
                withSettings,
                withNotification({
                    text: enabled
                        ? c('Info')
                              .t`You can now use your ${BRAND_NAME} password to access ${PASS_SHORT_APP_NAME} offline`
                        : c('Info').t`Offline support successfully disabled`,
                    type: 'info',
                })
            )({ payload: enabled }),
    },
    failure: {
        prepare: (error, enabled) =>
            withNotification({
                text: enabled
                    ? c('Info').t`Offline mode could not be enabled at the moment`
                    : c('Info').t`Offline mode could not be disabled at the moment`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});
