import { APPS, type APP_NAMES, USER_ROLES } from '../constants';
import { isElectronApp } from '../helpers/desktop';
import type { OrganizationWithSettings, User } from '../interfaces';
import { getIsGlobalSSOAccount, getIsPublicUserWithoutProtonAddress, getIsSSOVPNOnlyAccount } from '../keys';
import {
    deserializeAllowedProducts,
    getAppNameSetFromProductSet,
    getAreAllProductsAllowed,
} from '../organization/accessControl/serialization';

type AppContext = 'dropdown' | 'app';

export interface GetAvailableAppsByUserTypeArguments {
    user?: User;
    context: AppContext;
    isLumoAvailable: boolean;
    isDocsHomepageAvailable: boolean;
    oauth?: boolean;
}

type AppSet = Set<APP_NAMES>;

// This variable contains a list of all the apps.
// It is used in the list of apps, and also in determining if an app is accessible or not.
// The order is used in the app dropdown list.
const allApps: APP_NAMES[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONDRIVE,
    APPS.PROTONVPN_SETTINGS,
    APPS.PROTONPASS,
    APPS.PROTONDOCS,
    APPS.PROTONWALLET,
    APPS.PROTONLUMO,
];

const allAppsSet: Set<APP_NAMES> = new Set(allApps);

interface GetOrganizationAllowedProductsArguments {
    user?: User;
    organization?: { Settings: { AllowedProducts: OrganizationWithSettings['Settings']['AllowedProducts'] } };
}

const getAvailableAppsByOrganization = ({ user, organization }: GetOrganizationAllowedProductsArguments): AppSet => {
    // Admins can always access all
    if (!user || !organization || (user && user.Role === USER_ROLES.ADMIN_ROLE)) {
        return allAppsSet;
    }
    const allowedProducts = deserializeAllowedProducts(organization.Settings?.AllowedProducts);
    if (getAreAllProductsAllowed(allowedProducts)) {
        return allAppsSet;
    }
    return getAppNameSetFromProductSet(allowedProducts);
};

const getAvailableAppsByUser = (options: GetAvailableAppsByUserTypeArguments): AppSet => {
    if (options.oauth || getIsSSOVPNOnlyAccount(options.user)) {
        return new Set([APPS.PROTONVPN_SETTINGS]);
    }

    if (getIsPublicUserWithoutProtonAddress(options.user)) {
        if (getIsGlobalSSOAccount(options.user)) {
            // Drive is blocked for Global SSO users as of 22.02.2025. Only Pass and VPN are allowed for these users.
            return new Set([APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS]);
        }
        // Public users without a proton address can't create a proton address themselves, so only these apps are ok
        return new Set([
            APPS.PROTONVPN_SETTINGS,
            APPS.PROTONPASS,
            APPS.PROTONDRIVE,
            APPS.PROTONDOCS,
            APPS.PROTONWALLET,
            APPS.PROTONLUMO,
        ]);
    }

    if (isElectronApp) {
        return new Set([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);
    }

    // Otherwise all apps are ok
    return allAppsSet;
};

export const getAvailableApps = (
    options: GetAvailableAppsByUserTypeArguments & GetOrganizationAllowedProductsArguments
) => {
    const removeApps: AppSet = new Set();
    if (!options.isLumoAvailable) {
        removeApps.add(APPS.PROTONLUMO);
    }
    if (options.context === 'dropdown' && !options.isDocsHomepageAvailable) {
        removeApps.add(APPS.PROTONDOCS);
    }
    const availableAppsByUser = getAvailableAppsByUser(options);
    const availableAppsByOrganization = getAvailableAppsByOrganization(options);
    return allApps.filter((app) => {
        return !removeApps.has(app) && availableAppsByUser.has(app) && availableAppsByOrganization.has(app);
    });
};
