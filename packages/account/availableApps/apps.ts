import { APP_SWITCHER_APPS, type ProtonAppId, getAppSwitcherApps } from '@protontech/proton-apps/apps';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getUserAvailableApps } from '@proton/shared/lib/api/user';
import { SessionAccessTypeFlag, getSessionAccessTypeMask } from '@proton/shared/lib/authentication/sessionAccessType';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { User } from '@proton/shared/lib/interfaces/User';

/**
 * The web app each product opens. The app switcher order comes from @protontech/proton-apps, and every app it lists
 * must be mapped here, so bumping it to a version with a new app fails the type check until this client supports it
 */
const appsByProduct = {
    Mail: APPS.PROTONMAIL,
    Calendar: APPS.PROTONCALENDAR,
    VPN: APPS.PROTONVPN_SETTINGS,
    Drive: APPS.PROTONDRIVE,
    Docs: APPS.PROTONDOCS,
    Sheets: APPS.PROTONSHEETS,
    Pass: APPS.PROTONPASS,
    Wallet: APPS.PROTONWALLET,
    Lumo: APPS.PROTONLUMO,
    Meet: APPS.PROTONMEET,
    Spaces: APPS.PROTONSPACES,
} satisfies Record<Exclude<ProtonAppId, 'Authenticator'>, APP_NAMES>;

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

const getAppForProduct = (product: string) =>
    (appsByProduct as { [key in ProtonAppId]?: AvailableAppName })[product as ProtonAppId];

/** Leaving out products this client doesn't know an app for */
export const getAvailableAppsFromResponse = (apps: AvailableAppsResponse['Apps']): AvailableApp[] =>
    apps.flatMap(({ Product: product, Tier: tier }) => {
        const app = getAppForProduct(product);
        return app ? [{ app, tier }] : [];
    });

const queryAvailableProducts = async ({ api, user }: { api: Api; user: User }) => {
    // An MSP session, where a manager acts in a subsidiary, is only for managing it
    if (hasBit(getSessionAccessTypeMask(user), SessionAccessTypeFlag.OrgAccess)) {
        return [];
    }
    const { Apps } = await getSilentApi(api)<AvailableAppsResponse>(getUserAvailableApps());
    return Apps;
};

/** The apps the session's user can switch to, with their tiers. Silent, so callers decide what a failure means */
export const queryAvailableAppsWithTiers = async (
    options: Parameters<typeof queryAvailableProducts>[0]
): Promise<AvailableApp[]> => getAvailableAppsFromResponse(await queryAvailableProducts(options));

/** The apps the session's user can switch to, in app switcher order. Silent, so callers decide what a failure means */
export const queryAvailableApps = async (
    options: Parameters<typeof queryAvailableProducts>[0]
): Promise<APP_NAMES[]> => {
    const products = (await queryAvailableProducts(options)).map(({ Product: product }) => product);
    return getAppSwitcherApps(products).flatMap(({ id }) => getAppForProduct(id) ?? []);
};

/**
 * The apps @protontech/proton-apps lists for everyone, because without a session there's no context to compute
 * them from: no user for the available apps route, and nothing to evaluate feature flags against
 */
export const unauthenticatedApps: AvailableAppName[] = APP_SWITCHER_APPS.flatMap(
    ({ id }) => getAppForProduct(id) ?? []
);
