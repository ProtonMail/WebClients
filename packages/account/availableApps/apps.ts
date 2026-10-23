import { PLANS } from '@proton/payments/core/constants';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS, type APP_NAMES, PRODUCT_BIT } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Organization, OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { User } from '@proton/shared/lib/interfaces/User';
import { getHasBusinessProductPlan, getHasPlusPlan, getHasProPlan } from '@proton/shared/lib/payments/plan/helpers';
import { hasPassLifetime, hasPassViaSimpleLogin } from '@proton/shared/lib/user/helpers';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { getAvailableApps } from './getAvailableApps';

/** In app switcher order: each product's app, and the product bit the user's plan gives its tier through */
const appsByProduct = {
    [Product.Mail]: { app: APPS.PROTONMAIL, bit: PRODUCT_BIT.MAIL },
    [Product.Calendar]: { app: APPS.PROTONCALENDAR, bit: PRODUCT_BIT.MAIL },
    [Product.VPN]: { app: APPS.PROTONVPN_SETTINGS, bit: PRODUCT_BIT.VPN },
    [Product.Drive]: { app: APPS.PROTONDRIVE, bit: PRODUCT_BIT.DRIVE },
    [Product.Docs]: { app: APPS.PROTONDOCS, bit: PRODUCT_BIT.DRIVE },
    [Product.Sheets]: { app: APPS.PROTONSHEETS, bit: PRODUCT_BIT.DRIVE },
    [Product.Pass]: { app: APPS.PROTONPASS, bit: PRODUCT_BIT.PASS },
    [Product.Wallet]: { app: APPS.PROTONWALLET, bit: PRODUCT_BIT.WALLET },
    [Product.Lumo]: { app: APPS.PROTONLUMO, bit: PRODUCT_BIT.LUMO },
    [Product.Meet]: { app: APPS.PROTONMEET, bit: PRODUCT_BIT.MEET },
    [Product.Spaces]: { app: APPS.PROTONSPACES, bit: PRODUCT_BIT.SPACES },
} satisfies { [key in Product]?: { app: APP_NAMES; bit: PRODUCT_BIT } };

/** The apps the available apps can list */
export type AvailableAppName = (typeof appsByProduct)[keyof typeof appsByProduct]['app'];

/**
 * The apps the session's user can switch to, in app switcher order.
 *
 * Computed in the client for now. Every list of available apps comes from here, so that this can be replaced by the
 * API listing them: Authenticator was never released, and only Spaces is behind its feature flag.
 */
export const getAvailableAppsForUser = ({
    user,
    unleashClient,
    organization,
}: {
    user: User;
    unleashClient: UnleashClient;
    /** Only its allowed products matter, which are in its settings */
    organization: Pick<OrganizationExtended, 'Settings'> | undefined;
}): APP_NAMES[] => {
    return getAvailableApps({
        apps: Object.values(appsByProduct).map(({ app }) => app),
        user,
        organization,
        isSpacesAvailable: unleashClient.isEnabled('SpacesAvailable'),
    });
};

/** The tier of the plan an app comes with, which the explore apps list shows under it */
export type PlanTier = 'Plus' | 'Essentials' | 'Professional' | 'Family';

export interface AvailableApp {
    app: AvailableAppName;
    /** null when the user's plan doesn't include the app, or includes every app */
    tier: PlanTier | null;
}

const everyAppBit =
    PRODUCT_BIT.MAIL |
    PRODUCT_BIT.PASS |
    PRODUCT_BIT.DRIVE |
    PRODUCT_BIT.VPN |
    PRODUCT_BIT.WALLET |
    PRODUCT_BIT.LUMO |
    PRODUCT_BIT.MEET;

const getPlanTier = (plan: PLANS | undefined): PlanTier | null => {
    if (plan === PLANS.PASS_FAMILY) {
        return 'Family';
    }
    if (getHasProPlan(plan)) {
        return 'Essentials';
    }
    if (getHasBusinessProductPlan(plan)) {
        return 'Professional';
    }
    if (getHasPlusPlan(plan)) {
        return 'Plus';
    }
    return null;
};

/**
 * The apps the session's user can switch to, with the tier of the plan each comes with.
 *
 * Computed in the client for now, in the shape the API will return them.
 */
export const getAvailableAppsWithTiers = ({
    apps,
    user,
    organization,
}: {
    /** From getAvailableAppsForUser */
    apps: APP_NAMES[];
    user: User;
    /** Only for its plan */
    organization: Pick<Organization, 'PlanName'> | undefined;
}): AvailableApp[] => {
    // A bundle includes every app, so a tier wouldn't tell them apart
    const tier = hasBit(user.Subscribed, everyAppBit) ? null : getPlanTier(organization?.PlanName);
    // Pass Lifetime and Pass through SimpleLogin give Pass without a plan. Only counts when no plan includes Pass, e.g.
    // not next to a bundle, which gives it no tier.
    const hasPassWithoutPlan =
        !hasBit(user.Subscribed, PRODUCT_BIT.PASS) && (hasPassLifetime(user) || hasPassViaSimpleLogin(user));
    return Object.values(appsByProduct)
        .filter(({ app }) => apps.includes(app))
        .map(({ app, bit }) => {
            const appTier = hasBit(user.Subscribed, bit) ? tier : null;
            return { app, tier: appTier ?? (app === APPS.PROTONPASS && hasPassWithoutPlan ? 'Plus' : null) };
        });
};

/**
 * Hardcoded, because without a session there's no context to compute them from: no user, and nothing to evaluate
 * feature flags against. That's fine since this list may lag behind, being updated
 * by hand as apps launch.
 */
export const unauthenticatedApps: APP_NAMES[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONVPN_SETTINGS,
    APPS.PROTONDRIVE,
    APPS.PROTONDOCS,
    APPS.PROTONSHEETS,
    APPS.PROTONPASS,
    APPS.PROTONWALLET,
    APPS.PROTONLUMO,
    APPS.PROTONMEET,
];
