import { c } from 'ttag';

import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { DesktopSettingsDTO } from '@proton/pass/types/desktop';
import type { RecursivePartial } from '@proton/pass/types/utils';

export const setDesktopSettings = requestActionsFactory<DesktopSettingsDTO, RecursivePartial<ProxiedSettings>>(
    'desktop-settings::set'
)({
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

export const syncDesktopSettings = requestActionsFactory<void, RecursivePartial<ProxiedSettings>>(
    'desktop-settings::sync'
)();
