import { createSelector } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { getPassPlan } from '@proton/pass/lib/user/user.plan';
import { createUncachedSelector } from '@proton/pass/store/selectors/utils';
import { selectDefaultVault } from '@proton/pass/store/selectors/vaults';
import type { State } from '@proton/pass/store/types';
import { type Maybe, type MaybeNull } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { oneOf } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import { type Address, SETTINGS_PASSWORD_MODE, UserType } from '@proton/shared/lib/interfaces';
import { AuthDeviceState } from '@proton/shared/lib/keys/device';

export const selectUserState = ({ user }: State) => user;
export const selectUser = ({ user: { user } }: State) => user;
export const selectIsSSO = ({ user: { user } }: State) => Boolean(user?.Flags.sso);
export const selectUserPlan = ({ user: { plan } }: State) => plan;
export const selectUserSettings = ({ user: { userSettings } }: State) => userSettings;
export const selectUserData = ({ user: { userData } }: State) => userData;
export const selectHasPendingShareAccess = ({ user }: State) => (user.waitingNewUserInvites ?? 0) > 0;
export const selectSentinelEligible = ({ user }: State) => Boolean(user.userSettings?.HighSecurity.Eligible ?? false);
export const selectSentinelEnabled = ({ user }: State) => Boolean(user.userSettings?.HighSecurity.Value ?? false);
export const selectTelemetryEnabled = ({ user }: State) => user.userSettings?.Telemetry === 1;
export const selectUserType = ({ user }: State) => user.user?.Type;
export const selectLatestEventId = ({ user: { eventId } }: State) => eventId;
export const selectFeatureFlags = ({ user: { features } }: State) => features;
export const selectAddresses = ({ user }: State) => user.addresses;
export const selectAuthDevices = (state: State) => state.user.devices;
export const selectUserStorageUsed = ({ user }: State) => user.plan?.StorageUsed ?? 0;
export const selectUserStorageQuota = ({ user }: State) => user.plan?.StorageQuota ?? 0;
export const selectUserStorageMaxFileSize = ({ user }: State) => user.plan?.StorageMaxFileSize ?? 0;
export const selectUserStorageAllowed = ({ user }: State) => user.plan?.StorageAllowed;

/* Specification for pass specific plans in `/user/access` response :
 * `business` -> Plan: Business | Trial: null | Limits: none
 * `paid` -> Plan: Plus | Trial: null | Limits: none
 * `trial` -> Plan: Plus | Trial: unix timestamp end | Limits
 * `free` -> Plan: Free | Trial: null | Limits */
export const selectPassPlan = ({ user: { plan } }: State): UserPassPlan => getPassPlan(plan);

export const selectPlanDisplayName = createSelector([selectUserPlan, selectPassPlan], (userPlan, passPlan) => {
    switch (passPlan) {
        case UserPassPlan.TRIAL:
            return c('Info').t`Pass Plus trial`;
        case UserPassPlan.BUSINESS:
        case UserPassPlan.FREE:
        case UserPassPlan.PLUS:
            return userPlan?.DisplayName;
    }
});

export const selectTrialDaysRemaining = ({ user: { plan } }: State): MaybeNull<number> => {
    if (!plan?.TrialEnd) return null;
    return Math.ceil(Math.max((plan.TrialEnd - getEpoch()) / UNIX_DAY, 0));
};
/* user tier is only used for telemetry */
export const selectUserTier = ({ user: { user, plan } }: State): string | undefined =>
    user?.Type === UserType.MANAGED ? 'subuser' : plan?.InternalName;

export const selectAllAddresses = createUncachedSelector(selectAddresses, (addresses): Address[] =>
    Object.values(addresses)
);

export const selectFeatureFlag =
    (feature: PassFeature) =>
    ({ user: { features } }: State): boolean =>
        features?.[feature] ?? false;

/* User default vault shareId, currently used for SimpleLogin aliases sync.
 * If the user data has not been synced yet - fallback to the default share. */
export const selectUserDefaultShareID = createSelector(
    [selectUserData, selectDefaultVault],
    (userData, defaultShare): Maybe<string> => userData?.defaultShareId ?? defaultShare?.shareId
);

export const selectPendingAuthDevices = createSelector([selectAuthDevices, selectAddresses], (authDevices, addresses) =>
    authDevices
        .filter(({ State, ActivationAddressID }) =>
            Boolean(
                oneOf(AuthDeviceState.PendingActivation, AuthDeviceState.PendingAdminActivation)(State) &&
                    ActivationAddressID &&
                    addresses[ActivationAddressID]
            )
        )
        .sort(sortOn('CreateTime'))
);

export const selectInAppNotificationsEnabled = createSelector(selectUserSettings, (userSettings): boolean =>
    hasBit(userSettings?.News, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS)
);

export const selectIsPassEssentials = createSelector(
    selectUserPlan,
    (plan): boolean => plan?.Type === 'business' && plan.DisplayName === 'Pass Essentials'
);

export const selectHasTwoPasswordMode = ({ user }: State) =>
    user.userSettings?.Password.Mode === SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE;
