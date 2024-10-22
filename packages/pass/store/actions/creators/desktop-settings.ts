import { c } from 'ttag';

import type { DesktopSettingsDTO } from '@proton/pass/lib/desktop-settings/types';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { desktopSettingsSetRequest, desktopSettingsSyncRequest } from '@proton/pass/store/actions/requests';
import type { DesktopSettingsState } from '@proton/pass/store/reducers/desktop-settings';
import { requestActionsFactory } from '@proton/pass/store/request/flow';

export const setDesktopSettings = requestActionsFactory<DesktopSettingsDTO, DesktopSettingsDTO>(
    'desktop-settings::set'
)({
    requestId: desktopSettingsSetRequest,
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('Info').t`Settings successfully updated`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Could not update settings at the moment. Please try again later.`,
                error: error,
            })({ payload }),
    },
});

export const syncDesktopSettings = requestActionsFactory<void, DesktopSettingsState>('desktop-settings::sync')({
    requestId: desktopSettingsSyncRequest,
});
