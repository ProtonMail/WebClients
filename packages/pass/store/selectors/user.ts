import { createSelector } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { getPassPlan } from '@proton/pass/lib/user/user.plan';
import type { State } from '@proton/pass/store/types';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { type Address, SETTINGS_STATUS, UserType } from '@proton/shared/lib/interfaces';

import { selectDefaultVault } from './shares';

export const selectUserState = ({ user }: State) => user;
export const selectUser = ({ user: { user } }: State) => user;
export const selectUserPlan = ({ user: { plan } }: State) => plan;
export const selectUserSettings = ({ user: { userSettings } }: State) => userSettings;
export const selectUserData = ({ user: { userData } }: State) => userData;

export const selectSentinelEligible = ({ user }: State) => Boolean(user.userSettings?.HighSecurity.Eligible ?? false);
export const selectSentinelEnabled = ({ user }: State) => Boolean(user.userSettings?.HighSecurity.Value ?? false);
export const selectTelemetryEnabled = ({ user }: State) => user.userSettings?.Telemetry === 1;
export const selectUserVerified = ({ user }: State) =>
    user.user?.Type !== UserType.EXTERNAL || user.userSettings?.Email?.Status === SETTINGS_STATUS.VERIFIED;

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

export const selectAllAddresses = ({ user: { addresses } }: State): Address[] => Object.values(addresses);
export const selectAddress =
    (addressId: string) =>
    ({ user: { addresses } }: State): Maybe<Address> =>
        addresses[addressId];

export const selectLatestEventId = ({ user: { eventId } }: State) => eventId;

export const selectFeatureFlags = ({ user: { features } }: State) => features;

export const selectFeatureFlag =
    (feature: PassFeature) =>
    ({ user: { features } }: State): boolean =>
        features?.[feature] ?? false;

/* User default vault shareId, currently used for SimpleLogin aliases sync.
 * If the user data has not been synced yet - fallback to the default share. */
export const selectUserDefaultShareId = createSelector(
    [selectUserData, selectDefaultVault],
    (userData, defaultShare) => userData?.defaultShareId ?? defaultShare.shareId
);
