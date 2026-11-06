import { Product } from '@proton/shared/lib/ProductEnum';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getUserAvailableApps } from '@proton/shared/lib/api/user';
import { SessionAccessTypeFlag, getSessionAccessTypeMask } from '@proton/shared/lib/authentication/sessionAccessType';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { User } from '@proton/shared/lib/interfaces/User';

/** In app switcher order */
const appsByProduct = {
    [Product.Mail]: APPS.PROTONMAIL,
    [Product.Calendar]: APPS.PROTONCALENDAR,
    [Product.VPN]: APPS.PROTONVPN_SETTINGS,
    [Product.Drive]: APPS.PROTONDRIVE,
    [Product.Docs]: APPS.PROTONDOCS,
    [Product.Sheets]: APPS.PROTONSHEETS,
    [Product.Pass]: APPS.PROTONPASS,
    [Product.Wallet]: APPS.PROTONWALLET,
    [Product.Lumo]: APPS.PROTONLUMO,
    [Product.Meet]: APPS.PROTONMEET,
    [Product.Spaces]: APPS.PROTONSPACES,
} satisfies { [key in Product]?: APP_NAMES };

/** The apps the available apps can list */
export type AvailableAppName = (typeof appsByProduct)[keyof typeof appsByProduct];

/** The tier of the plan an app comes with, which the explore apps list shows under it */
export type PlanTier = 'Plus' | 'Essentials' | 'Professional' | 'Family';

export interface AvailableApp {
    app: AvailableAppName;
    /** null when the user's plan doesn't include the app, or includes every app */
    tier: PlanTier | null;
}

interface AvailableAppsResponse {
    /** In no particular order */
    Apps: { Product: string; Tier: PlanTier | null }[];
}

/** Leaving out products this client doesn't know an app for */
export const getAvailableAppsFromResponse = (apps: AvailableAppsResponse['Apps']): AvailableApp[] =>
    apps.flatMap(({ Product: product, Tier: tier }) => {
        const app = (appsByProduct as { [key in Product]?: AvailableAppName })[product as Product];
        return app ? [{ app, tier }] : [];
    });

/** The apps the session's user can switch to, with their tiers. Silent, so callers decide what a failure means */
export const queryAvailableAppsWithTiers = async ({ api, user }: { api: Api; user: User }): Promise<AvailableApp[]> => {
    // An MSP session, where a manager acts in a subsidiary, is only for managing it
    if (hasBit(getSessionAccessTypeMask(user), SessionAccessTypeFlag.OrgAccess)) {
        return [];
    }
    const { Apps } = await getSilentApi(api)<AvailableAppsResponse>(getUserAvailableApps());
    return getAvailableAppsFromResponse(Apps);
};

/** The apps the session's user can switch to, in app switcher order. Silent, so callers decide what a failure means */
export const queryAvailableApps = async (
    options: Parameters<typeof queryAvailableAppsWithTiers>[0]
): Promise<APP_NAMES[]> => {
    const apps = (await queryAvailableAppsWithTiers(options)).map(({ app }) => app);
    return Object.values(appsByProduct).filter((app) => apps.includes(app));
};

/**
 * Hardcoded, because without a session there's no context to compute them from: no user for the available apps
 * route, and nothing to evaluate feature flags against. That's fine since this list may lag behind, being updated
 * by hand as apps launch.
 */
export const unauthenticatedApps: AvailableAppName[] = [
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
