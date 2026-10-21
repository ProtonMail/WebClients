import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { Audience } from '@proton/shared/lib/interfaces/Subscription';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { PLANS } from '../constants';
import { getPlan } from './helpers';
import type { MaybeFreeSubscription } from './interface';
import {
    type LooseSubscriptionSearchParams,
    type SubscriptionSearchParams,
    getSubscriptionSearchParamsString,
} from './search-params';

type GetUpgradePathParams = LooseSubscriptionSearchParams & {
    user?: UserModel;
    app?: APP_NAMES;
    subscription?: MaybeFreeSubscription;
    audience?: Audience;
    disablePlanSelection?: boolean;
};

/**
 * Builds the URL to send a user to upgrade or manage their subscription, via
 * {@link getSubscriptionSearchParamsString}.
 *
 * - Free/missing user: links to `/upgrade` (or `/dashboard` on VPN settings). `target` is
 *   always dropped, matching the legacy behaviour (plan selection page, never direct checkout).
 * - Paid user: links to `/dashboard`, always resolving `plan` (from params, current
 *   subscription, or {@link PLANS.BUNDLE}) and defaulting `target` to `'compare'`.
 * - `disablePlanSelection` maps to the canonical `fixedPlan: true`.
 *
 * @param ref - Optional upsell ref appended to the search params.
 */
export const getUpgradePath = (
    { user, subscription, disablePlanSelection, app, ...searchParamsWithAudience }: GetUpgradePathParams,
    ref?: string
): string => {
    const baseParams: Record<string, unknown> = { ...searchParamsWithAudience };

    if (ref) {
        baseParams.ref = ref;
    }

    if (disablePlanSelection) {
        baseParams.fixedPlan = true;
    }

    if (!user || user.isFree) {
        const pathname = app === APPS.PROTONVPN_SETTINGS ? '/dashboard' : '/upgrade';

        delete baseParams.target;

        const search = getSubscriptionSearchParamsString(baseParams as SubscriptionSearchParams);
        return search ? `${pathname}?${search}` : pathname;
    }

    const resolvedPlan = (baseParams.plan as PLANS) ?? (getPlan(subscription)?.Name as PLANS) ?? PLANS.BUNDLE;
    baseParams.plan = resolvedPlan;
    baseParams.target = baseParams.target === 'checkout' ? 'checkout' : 'compare';

    const search = getSubscriptionSearchParamsString(baseParams as SubscriptionSearchParams);

    return `/dashboard?${search}`;
};
