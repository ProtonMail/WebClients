import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import identity from '@proton/utils/identity';

import type { PasswordCredentials } from '../../../lib/auth/password';
import type { PasswordTypeConfig } from '../../../lib/auth/utils';
import { passwordTypeSwitch } from '../../../lib/auth/utils';
import type { CriteriaMasks } from '../../../lib/settings/pause-list';
import type { ClientEndpoint, RecursivePartial } from '../../../types';
import { pipe } from '../../../utils/fp/pipe';
import type { ProxiedSettings } from '../../reducers/settings';
import { withRequest, withRequestFailure, withRequestSuccess } from '../../request/enhancers';
import { requestActionsFactory } from '../../request/flow';
import { withCache } from '../enhancers/cache';
import { withNotification } from '../enhancers/notification';
import { withSettings } from '../enhancers/settings';
import { settingsEditRequest } from '../requests';

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
