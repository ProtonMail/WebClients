import { APPS, APPS_CONFIGURATION, type APP_NAMES, USER_ROLES } from '../constants';
import { isElectronApp } from '../helpers/desktop';
import type { OrganizationSettingsAllowedProduct, OrganizationWithSettings, User } from '../interfaces';
import { getIsPublicUserWithoutProtonAddress, getIsSSOVPNOnlyAccount } from '../keys';

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

export const getAvailableAppsByUserType = (options: { user?: User; context: AppContext; isLumoAvailable: boolean }) => {
    if (getIsSSOVPNOnlyAccount(options.user)) {
        return getSSOVPNOnlyAccountApps();
    }
    if (getIsPublicUserWithoutProtonAddress(options.user)) {
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

const getOrganizationAllowedProducts = (options: {
    user?: User;
    organization?: OrganizationWithSettings;
}): Set<OrganizationSettingsAllowedProduct> => {
    // Admins can always access all
    if (!options.user || !options.organization || (options.user && options.user.Role === USER_ROLES.ADMIN_ROLE)) {
        return new Set(['All']);
    }
    // If allowed products does not exist it falls back to all
    return new Set(options.organization.Settings?.AllowedProducts || ['All']);
};

const getAvailableAppsByOrganization = (options: {
    apps: APP_NAMES[];
    user?: User;
    organization?: OrganizationWithSettings;
}) => {
    const organizationAllowedProducts = getOrganizationAllowedProducts({
        user: options.user,
        organization: options.organization,
    });
    if (organizationAllowedProducts.has('All')) {
        return options.apps;
    }
    return options.apps.filter((app) => {
        const product = APPS_CONFIGURATION[app].product;
        return organizationAllowedProducts.has(product as OrganizationSettingsAllowedProduct);
    });
};

export const getAvailableApps = (
    options: Parameters<typeof getAvailableAppsByUserType>[0] & {
        organization?: OrganizationWithSettings;
    }
) => {
    const apps = getAvailableAppsByUserType(options);
    return getAvailableAppsByOrganization({ apps, user: options.user, organization: options.organization });
};
