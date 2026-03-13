import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { PasswordCredentials } from '@proton/pass/lib/auth/password';
import type { PasswordTypeConfig } from '@proton/pass/lib/auth/utils';
import { passwordTypeSwitch } from '@proton/pass/lib/auth/utils';
import type { CriteriaMasks } from '@proton/pass/lib/settings/pause-list';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import { settingsEditRequest } from '@proton/pass/store/actions/requests';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { ClientEndpoint, RecursivePartial } from '@proton/pass/types';
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
    withRequestSuccess((payload: ProxiedSettings, silent?: boolean, endpoint?: ClientEndpoint) =>
        pipe(
            withCache,
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

export const updatePauseListItem = createAction('settings::pause-list::update', (payload: { hostname: string; criteria: CriteriaMasks }) =>
    pipe(withSettings, withCache)({ payload })
);

export const offlineSetup = requestActionsFactory<PasswordCredentials, PasswordTypeConfig, void>('offline::toggle')({
    intent: {
        prepare: (payload) =>
            withNotification({
                loading: true,
                text: c('Info').t`Enabling offline mode...`,
                type: 'info',
            })({ payload }),
    },
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withSettings,
                withNotification({
                    type: 'info',
                    text: passwordTypeSwitch(payload)({
                        extra: c('Info').t`You can now use your extra password to access ${PASS_SHORT_APP_NAME} offline`,
                        twoPwd: c('Info').t`You can now use your second password to access ${PASS_SHORT_APP_NAME} offline`,
                        sso: c('Info').t`You can now use your backup password to access ${PASS_SHORT_APP_NAME} offline`,
                        default: c('Info').t`You can now use your ${BRAND_NAME} password to access ${PASS_SHORT_APP_NAME} offline`,
                    }),
                })
            )({ payload }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Info').t`Offline mode could not be enabled at the moment`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const redeemCoupon = requestActionsFactory<string, boolean>('coupon::redeem')({
    success: {
        prepare: (payload) =>
            withNotification({
                text: c('Info').t`Coupon successfully applied!`,
                type: 'info',
            })({ payload }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Warning').t`Coupon could not be applied.`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});
