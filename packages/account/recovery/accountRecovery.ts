import { createSelector } from '@reduxjs/toolkit';
import { isValid, parseISO } from 'date-fns';

import { getIsAccountRecoveryAvailable } from '@proton/shared/lib/helpers/recovery';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';

import { getCanDisableRecovery } from '../delegatedAccess/recoveryContact/getCanDisableRecovery';
import { selectEnrichedOutgoingDelegatedAccess } from '../delegatedAccess/shared/outgoing/selector';
import { selectUser } from '../user';
import { selectUserSettings } from '../userSettings';
import { selectLegacySentinel } from './sentinelSelectors';

const parseUpdateTime = (updateTime: string | null | undefined) => {
    if (!updateTime) {
        return null;
    }
    const date = parseISO(updateTime);
    return isValid(date) ? date : null;
};

export const selectAccountRecovery = createSelector(
    [selectUser, selectUserSettings, selectEnrichedOutgoingDelegatedAccess, selectLegacySentinel],
    ({ value: user }, { value: userSettings }, outgoingItems, sentinel) => {
        const canDisableRecovery = getCanDisableRecovery({
            recoveryContacts: outgoingItems.recoveryContacts.items,
            userSettings,
        });

        const isAccountRecoveryAvailable = getIsAccountRecoveryAvailable(user);

        const emailStatus = userSettings?.Email.Status ?? SETTINGS_STATUS.UNVERIFIED;
        const hasEmailReset = Boolean(userSettings && !!userSettings.Email.Reset);
        const isEmailVerified = emailStatus === SETTINGS_STATUS.VERIFIED;
        const emailValue = userSettings?.Email.Value ?? '';
        const hasPerfectEmailState = hasEmailReset && !!emailValue && isEmailVerified;

        const phoneStatus = userSettings?.Phone.Status ?? SETTINGS_STATUS.UNVERIFIED;
        const hasPhoneReset = Boolean(userSettings && !!userSettings.Phone.Reset);
        const isPhoneVerified = phoneStatus === SETTINGS_STATUS.VERIFIED;
        const phoneValue = userSettings?.Phone.Value ?? '';
        const hasPerfectPhoneState = hasPhoneReset && !!phoneValue && isPhoneVerified;

        const hasPerfectPasswordResetState = hasPerfectEmailState || hasPerfectPhoneState;

        return {
            isAccountRecoveryAvailable,
            hasPerfectPasswordResetState,
            isSentinelEnabled: sentinel.isSentinelUser,
            emailRecovery: {
                canDisable: canDisableRecovery.canDisableEmail,
                perfect: hasPerfectEmailState,
                // This used to be determined as enabled when it had a value and reset toggled. However now we include verified.
                legacyEnabled: !!emailValue && hasEmailReset,
                value: emailValue,
                hasReset: hasEmailReset,
                hasNotify: Boolean(userSettings && !!userSettings.Email.Notify),
                status: emailStatus,
                isVerified: isEmailVerified,
                updateTime: parseUpdateTime(userSettings?.Email.UpdateTime),
            },
            phoneRecovery: {
                canDisable: canDisableRecovery.canDisablePhone,
                perfect: hasPerfectPhoneState,
                // This used to be determined as enabled when it had a value and reset toggled. However now we include verified.
                legacyEnabled: !!phoneValue && hasPhoneReset,
                value: phoneValue,
                hasReset: hasPhoneReset,
                hasNotify: Boolean(userSettings && !!userSettings.Phone.Notify),
                status: phoneStatus,
                isVerified: isPhoneVerified,
                updateTime: parseUpdateTime(userSettings?.Phone.UpdateTime),
            },
            loading: !userSettings,
        };
    }
);
