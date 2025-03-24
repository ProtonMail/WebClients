import { APPS, APPS_CONFIGURATION, type APP_NAMES, USER_ROLES } from '../constants';
import { isElectronApp } from '../helpers/desktop';
import type { OrganizationSettingsAllowedProduct, OrganizationWithSettings, User } from '../interfaces';
import { getIsGlobalSSOAccount, getIsPublicUserWithoutProtonAddress, getIsSSOVPNOnlyAccount } from '../keys';

type AppContext = 'dropdown' | 'app';

export const getPublicUserProtonAddressApps = (context: AppContext): APP_NAMES[] => {
    const result: APP_NAMES[] = [APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS, APPS.PROTONDRIVE];

    // Proton Docs is never shown in the dropdown context, but we still need it in this list to ensure it's an allowed app.
    if (context === 'app') {
        result.push(APPS.PROTONDOCS);
    }

    return result;
};

export const getSSOVPNOnlyAccountApps = (): APP_NAMES[] => {
    return [APPS.PROTONVPN_SETTINGS];
};

export interface GetAvailableAppsByUserTypeArguments {
    user?: User;
    context: AppContext;
    isLumoAvailable: boolean;
    oauth?: boolean;
}

export const getAvailableAppsByUserType = (options: GetAvailableAppsByUserTypeArguments) => {
    if (options.oauth) {
        return getSSOVPNOnlyAccountApps();
    }
    if (getIsSSOVPNOnlyAccount(options.user)) {
        return getSSOVPNOnlyAccountApps();
    }
    if (getIsPublicUserWithoutProtonAddress(options.user)) {
        if (getIsGlobalSSOAccount(options.user)) {
            // Drive is blocked for Global SSO users as of 22.02.2025
            return [APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS];
        }
        return getPublicUserProtonAddressApps(options.context);
    }
    if (isElectronApp) {
        return [APPS.PROTONMAIL, APPS.PROTONCALENDAR];
    }

    const apps: APP_NAMES[] = [
        APPS.PROTONMAIL,
        APPS.PROTONCALENDAR,
        APPS.PROTONDRIVE,
        APPS.PROTONVPN_SETTINGS,
        APPS.PROTONPASS,
        APPS.PROTONWALLET,
    ];

    if (options.isLumoAvailable) {
        apps.push(APPS.PROTONLUMO);
    }

    return apps;
};

const all: Set<'All'> = new Set(['All']);

interface GetOrganizationAllowedProductsArguments {
    user?: User;
    organization?: OrganizationWithSettings;
    isAccessControlEnabled: boolean;
}

const getAvailableAppsByOrganization = ({
    user,
    organization,
    isAccessControlEnabled,
}: GetOrganizationAllowedProductsArguments): Set<OrganizationSettingsAllowedProduct> => {
    // Admins can always access all
    if (!isAccessControlEnabled || !user || !organization || (user && user.Role === USER_ROLES.ADMIN_ROLE)) {
        return all;
    }
    const allowedProducts = organization.Settings?.AllowedProducts;
    // Backwards compatibility, the API might not be ready, if it doesn't exist, fall back to all
    if (allowedProducts) {
        return new Set(allowedProducts);
    }
    return all;
};

export const getAvailableApps = (
    options: GetAvailableAppsByUserTypeArguments & GetOrganizationAllowedProductsArguments
) => {
    const availableAppsByUserType = getAvailableAppsByUserType(options);
    const availableAppsByOrganization = getAvailableAppsByOrganization(options);
    if (availableAppsByOrganization.has('All')) {
        return availableAppsByUserType;
    }
    return availableAppsByUserType.filter((app) => {
        const product = APPS_CONFIGURATION[app].product;
        return availableAppsByOrganization.has(product as OrganizationSettingsAllowedProduct);
    });
};
