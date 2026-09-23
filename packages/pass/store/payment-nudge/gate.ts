import type { PLANS } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import type { User } from '@proton/shared/lib/interfaces';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/payments/plan/helpers';
import { isAdmin, isPaid } from '@proton/shared/lib/user/helpers';

import type { Maybe, MaybeNull, PassPlanResponse } from '../../types';
import { getEpoch } from '../../utils/time/epoch';

/** Local pre-gate: decides whether the payment method lookup is worth an API call.
 * `isAdmin && isPaid` mirrors `canFetch` in `packages/account/subscription/index.ts`,
 * which is what account itself requires before hitting the payments API.
 *
 * `InternalName` carries the real plan name from `/pass/v1/user/access`, using the
 * same values as the `PLANS` enum, so the B2B audience check resolves locally.
 * `payments/v4/subscription` and its `IsTrial` are not available to Pass, which
 * leaves `TrialEnd` as the only trial signal. */
export const canQueryPaymentNudge = (plan: Maybe<MaybeNull<PassPlanResponse>>, user: Maybe<MaybeNull<User>>): boolean => {
    if (!plan || !user) return false;
    if (!plan.ManageSubscription) return false;
    if (!(isAdmin(user) && isPaid(user))) return false;
    if (!getIsB2BAudienceFromPlan(plan.InternalName as Maybe<PLANS>)) return false;

    return Boolean(plan.TrialEnd && getEpoch() < plan.TrialEnd);
};

/** `undefined` means the lookup has not resolved: absence of a payment method
 * is only established by a successful response holding an empty list. */
export const hasNoPaymentMethod = (methods: Maybe<MaybeNull<SavedPaymentMethod[]>>): boolean =>
    Array.isArray(methods) && methods.length === 0;
