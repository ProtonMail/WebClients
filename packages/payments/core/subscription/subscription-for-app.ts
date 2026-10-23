import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import { getEntitlementsPerSubscription } from '../entitlements/entitlement-grants';
import { EntitlementName } from '../entitlements/entitlement-names';
import type { EntitlementCatalog } from '../entitlements/interface';
import type { Subscription } from './interface';

type ProductFlag = Extract<EntitlementName, `flags-${string}`>;

export const appsByProductFlag: Record<ProductFlag, readonly APP_NAMES[]> = {
    [EntitlementName.FlagsInbox]: [APPS.PROTONMAIL, APPS.PROTONCALENDAR],
    [EntitlementName.FlagsDrive]: [
        APPS.PROTONDRIVE,
        APPS.PROTONDOCS,
        APPS.PROTONDOCSEDITOR,
        APPS.PROTONSHEETS,
        APPS.PROTONSHEETSEDITOR,
    ],
    [EntitlementName.FlagsPass]: [APPS.PROTONPASS, APPS.PROTONPASSBROWSEREXTENSION],
    [EntitlementName.FlagsVpn]: [APPS.PROTONVPN_SETTINGS, APPS.PROTONVPNBROWSEREXTENSION],
    [EntitlementName.FlagsLumo]: [APPS.PROTONLUMO],
    [EntitlementName.FlagsMeet]: [APPS.PROTONMEET],
    [EntitlementName.FlagsWallet]: [APPS.PROTONWALLET],
};

const productFlags = Object.keys(appsByProductFlag) as ProductFlag[];

const isProductFlag = (name: EntitlementName): name is ProductFlag => productFlags.includes(name as ProductFlag);

export const getProductFlagForApp = (appName: APP_NAMES): ProductFlag | undefined =>
    productFlags.find((flag) => appsByProductFlag[flag].includes(appName));

const getGrantedProductFlags = (
    entitlementCatalog: EntitlementCatalog | undefined,
    subscription: Subscription
): ProductFlag[] =>
    getEntitlementsPerSubscription(entitlementCatalog, subscription)
        .filter((entitlement) => entitlement.quantity > 0)
        .map((entitlement) => entitlement.name)
        .filter(isProductFlag);

export const getSubscriptionForApp = (
    subscriptions: Subscription[],
    entitlementCatalog: EntitlementCatalog | undefined,
    appName: APP_NAMES
): Subscription | undefined => {
    const productFlag = getProductFlagForApp(appName);
    if (!productFlag) {
        return subscriptions[0];
    }

    const candidates = subscriptions
        .map((subscription) => ({
            subscription,
            productFlags: getGrantedProductFlags(entitlementCatalog, subscription),
        }))
        .filter((candidate) => candidate.productFlags.includes(productFlag));

    if (candidates.length === 0) {
        return subscriptions[0];
    }

    return candidates.reduce((best, candidate) =>
        candidate.productFlags.length > best.productFlags.length ? candidate : best
    ).subscription;
};
