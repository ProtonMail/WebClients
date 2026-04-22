import { createSelector } from '@reduxjs/toolkit';

import { selectOrganization } from '@proton/account/organization';
import { selectUserSettings } from '@proton/account/userSettings';
import { ORGANIZATION_POLICY_ENFORCED, SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/constants';
import { isProtonSentinelEligible } from '@proton/shared/lib/helpers/userSettings';

export const selectLegacySentinel = createSelector([selectUserSettings], ({ value: userSettings }) => {
    const isSentinelUser = userSettings?.HighSecurity?.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;
    return {
        isSentinelUser,
        loading: !userSettings,
    };
});

export const selectOrganizationSentinel = createSelector([selectOrganization], ({ value: organization }) => {
    const orgSentinelEnforced = organization?.Settings.OrganizationPolicy.Enforced === ORGANIZATION_POLICY_ENFORCED.YES;
    const orgSentinelValue = organization?.Settings.HighSecurity;
    const orgSentinelEnabled = orgSentinelValue === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;
    const value = orgSentinelValue || SETTINGS_PROTON_SENTINEL_STATE.DISABLED;

    return {
        loading: organization === undefined,
        eligible: orgSentinelEnforced || orgSentinelEnabled,
        value,
        checked: value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED,
        enforcedByOrganization: orgSentinelEnforced,
    };
});

export const selectUserSentinel = createSelector(
    [selectUserSettings, selectOrganization],
    ({ value: userSettings }, { value: organization }) => {
        const orgSentinelValue = organization?.Settings.HighSecurity;
        const orgSentinelEnabled = orgSentinelValue === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;

        const userSentinelValue = userSettings?.HighSecurity.Value || SETTINGS_PROTON_SENTINEL_STATE.DISABLED;
        const orgSentinelEnforced = userSettings?.OrganizationPolicy.Enforced === ORGANIZATION_POLICY_ENFORCED.YES;

        const value = orgSentinelEnabled ? orgSentinelValue : userSentinelValue;

        return {
            loading: userSettings === undefined || organization === undefined,
            eligible: Boolean(userSettings && isProtonSentinelEligible(userSettings)),
            value,
            checked: value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED,
            enforcedByOrganization: orgSentinelEnforced && orgSentinelEnabled,
            notificationEmails: userSettings?.HighSecurity?.SummaryEmail,
        };
    }
);
