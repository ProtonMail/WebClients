import type { Maybe, MaybeNull } from '@proton/pass/types';
import { PlanType } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { UNIX_DAY, getEpoch } from '@proton/pass/utils/time';
import { type Address, UserType } from '@proton/shared/lib/interfaces';

import type { State } from '../types';

export const selectUserState = ({ user }: State) => user;

export const selectUser = ({ user: { user } }: State) => user;
export const selectUserPlan = ({ user: { plan } }: State) => plan;

/* Specification for pass specific plans in `/user/access` response :
 * `paid` -> Plan: Plus | Trial: null | Limits: none
 * `trial` -> Plan: Free | Trial: unix timestamp end | Limits
 * `free` -> Plan: Free | Trial: null | Limits */
export const selectPassPlan = ({ user: { plan } }: State): UserPassPlan => {
    switch (plan?.Type) {
        case PlanType.plus:
            return plan?.TrialEnd !== null ? UserPassPlan.TRIAL : UserPassPlan.PLUS;
        default: {
            return UserPassPlan.FREE;
        }
    }
};

export const selectTrialDaysLeft = ({ user: { plan } }: State): MaybeNull<number> => {
    if (!plan?.TrialEnd) return null;
    const remaining = plan.TrialEnd - getEpoch();
    return Math.ceil(remaining / UNIX_DAY);
};
/* user tier is only used for telemetry */
export const selectUserTier = ({ user: { user, plan } }: State) =>
    user?.Type === UserType.MANAGED ? 'subuser' : plan?.InternalName;

export const selectAllAddresses = ({ user: { addresses } }: State): Address[] => Object.values(addresses);
export const selectAddress =
    (addressId: string) =>
    ({ user: { addresses } }: State): Maybe<Address> =>
        addresses[addressId];

export const selectLatestEventId = ({ user: { eventId } }: State) => eventId;

export const selectUserFeature =
    <T extends any>(feature: PassFeature) =>
    ({ user: { features } }: State): MaybeNull<T> =>
        (features?.[feature]?.Value as T) ?? null;
