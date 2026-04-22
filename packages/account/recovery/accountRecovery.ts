import { createSelector } from '@reduxjs/toolkit';

import { getCanDisableRecovery } from '@proton/account/delegatedAccess/recoveryContact/getCanDisableRecovery';
import { selectEnrichedOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/shared/outgoing/selector';
import { selectUserSettings } from '@proton/account/userSettings';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/constants';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';

export const selectAccountRecovery = createSelector(
    [selectUserSettings, selectEnrichedOutgoingDelegatedAccess],
    ({ value: userSettings }, outgoingItems) => {
        const canDisableRecovery = getCanDisableRecovery({
            recoveryContacts: outgoingItems.items.recoveryContacts,
            userSettings,
        });
        const emailStatus = userSettings?.Email.Status ?? SETTINGS_STATUS.UNVERIFIED;
        const phoneStatus = userSettings?.Phone.Status ?? SETTINGS_STATUS.UNVERIFIED;
        return {
            isSentinelEnabled: userSettings?.HighSecurity?.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED,
            emailRecovery: {
                canDisable: canDisableRecovery.canDisableEmail,
                enabled: Boolean(userSettings && !!userSettings.Email.Reset && !!userSettings.Email.Value),
                value: userSettings?.Email.Value ?? '',
                hasReset: Boolean(userSettings && !!userSettings.Email.Reset),
                hasNotify: Boolean(userSettings && !!userSettings.Email.Notify),
                status: emailStatus,
                isVerified: emailStatus === SETTINGS_STATUS.VERIFIED,
            },
            phoneRecovery: {
                canDisable: canDisableRecovery.canDisablePhone,
                enabled: Boolean(userSettings && !!userSettings.Phone.Reset && !!userSettings.Phone.Value),
                value: userSettings?.Phone?.Value ?? '',
                hasReset: Boolean(userSettings && !!userSettings.Phone.Reset),
                hasNotify: Boolean(userSettings && !!userSettings.Phone.Notify),
                status: userSettings?.Phone.Status ?? SETTINGS_STATUS.UNVERIFIED,
                isVerified: phoneStatus === SETTINGS_STATUS.VERIFIED,
            },
            loading: !userSettings,
        };
    }
);
