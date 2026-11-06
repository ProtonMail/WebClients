import { ADDON_NAMES, PLANS } from '../core/constants';
import { EntitlementName } from '../core/entitlements/entitlement-names';
import type { MaybeFreeSubscription, Subscription } from '../core/subscription/interface';
import {
    type MultiSubscriptionContext,
    createMultiSubscriptionContext,
} from '../core/subscription/multi-subscription-context';
import { buildEntitlementCatalog } from './buildEntitlementCatalog';
import { buildSubscription } from './buildSubscription';
import { prodCatalogGrantsForTesting } from './prodCatalogGrantsForTesting';

const lumoGrants = [EntitlementName.FlagsLumo, EntitlementName.MaxLumoSeats];

export const multiSubscriptionTestCatalog = buildEntitlementCatalog(
    {
        ...prodCatalogGrantsForTesting,
        [PLANS.LUMO_BASIC]: lumoGrants,
        [PLANS.LUMO]: lumoGrants,
        [PLANS.LUMO_ULTRA]: lumoGrants,
        [PLANS.DRIVE_1TB]: [EntitlementName.FlagsDrive],
        [PLANS.VPN_PASS_BUNDLE]: [EntitlementName.FlagsVpn, EntitlementName.FlagsPass],
        [PLANS.PASS_FAMILY]: [EntitlementName.FlagsPass, EntitlementName.MultiUser],
    },
    {
        [ADDON_NAMES.LUMO_MAIL]: lumoGrants,
        [ADDON_NAMES.LUMO_VPN2024]: lumoGrants,
        [ADDON_NAMES.LUMO_BUNDLE]: lumoGrants,
        [ADDON_NAMES.LUMO_FAMILY]: lumoGrants,
        [ADDON_NAMES.LUMO_DUO]: lumoGrants,
    }
);

export const buildLumoSubscription = (planName: PLANS, override?: Partial<Subscription>): Subscription => {
    const subscription = buildSubscription(PLANS.LUMO, override);
    return {
        ...subscription,
        Plans: subscription.Plans.map((plan) => ({ ...plan, Name: planName })),
    };
};

export const buildMultiSubscriptionContext = (
    subscriptions: Subscription[],
    lumoMultiSubscriptions = true
): MultiSubscriptionContext => ({
    lumoMultiSubscriptions,
    subscriptions,
    entitlementCatalog: multiSubscriptionTestCatalog,
});

export const buildMultiSubscriptionContextFromSubscription = (
    subscription: MaybeFreeSubscription | null | undefined
): MultiSubscriptionContext =>
    createMultiSubscriptionContext({ lumoMultiSubscriptions: false, subscription, entitlementCatalog: undefined });
