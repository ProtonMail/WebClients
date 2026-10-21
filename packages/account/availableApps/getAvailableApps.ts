import { getForbiddenApps } from '@proton/shared/lib/apps/apps';
import { SessionAccessTypeFlag, getSessionAccessTypeMask } from '@proton/shared/lib/authentication/sessionAccessType';
import { APPS, type APP_NAMES, USER_ROLES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { User } from '@proton/shared/lib/interfaces/User';
import {
    getIsExternalUserWithoutProtonAddressCreation,
    getIsGlobalSSOAccount,
    getIsSSOVPNOnlyAccount,
} from '@proton/shared/lib/keys/accountType';
import {
    allAllowedProducts,
    deserializeAllowedProducts,
    getAppNameSetFromProductSet,
} from '@proton/shared/lib/organization/accessControl/serialization';

interface GetAvailableAppsByUserTypeArguments {
    user?: User;
    isSpacesAvailable: boolean;
}

type AppSet = Set<APP_NAMES>;

interface GetOrganizationAllowedProductsArguments {
    user?: User;
    organization?: { Settings: { AllowedProducts: OrganizationExtended['Settings']['AllowedProducts'] } };
}

/** undefined when the organization doesn't restrict the user */
const getAvailableAppsByOrganization = ({
    user,
    organization,
}: GetOrganizationAllowedProductsArguments): AppSet | undefined => {
    // Admins can always access all
    if (!user || !organization || (user && user.Role === USER_ROLES.ADMIN_ROLE)) {
        return undefined;
    }
    const allowedProducts = deserializeAllowedProducts(organization.Settings?.AllowedProducts);
    if (allowedProducts === allAllowedProducts || allAllowedProducts.difference(allowedProducts).size === 0) {
        return undefined;
    }
    return getAppNameSetFromProductSet(allowedProducts);
};

/** undefined when the user's account type doesn't restrict them */
const getAvailableAppsByUser = (options: GetAvailableAppsByUserTypeArguments): AppSet | undefined => {
    // Disallow MSP sessions to access any apps. It's only allowed for organization admin management.
    if (options.user && hasBit(getSessionAccessTypeMask(options.user), SessionAccessTypeFlag.OrgAccess)) {
        return new Set([]);
    }

    if (getIsSSOVPNOnlyAccount(options.user)) {
        return new Set([APPS.PROTONVPN_SETTINGS]);
    }

    if (getIsGlobalSSOAccount(options.user)) {
        // Drive is blocked for Global SSO users as of 22.02.2025. Only Pass, VPN and Lumo are allowed for these users.
        return new Set([APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS, APPS.PROTONLUMO]);
    }

    if (getIsExternalUserWithoutProtonAddressCreation(options.user)) {
        // Public users without a proton address can't create a proton address themselves, so only these apps are ok
        return new Set([
            APPS.PROTONVPN_SETTINGS,
            APPS.PROTONPASS,
            APPS.PROTONDRIVE,
            APPS.PROTONDOCS,
            APPS.PROTONSHEETS,
            APPS.PROTONWALLET,
            APPS.PROTONLUMO,
            APPS.PROTONMEET,
            APPS.PROTONSPACES,
        ]);
    }

    if (isElectronMail) {
        return new Set([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);
    }

    // Otherwise all apps are ok
    return undefined;
};

export const getAvailableApps = (
    options: GetAvailableAppsByUserTypeArguments &
        GetOrganizationAllowedProductsArguments & {
            /** Every app to consider, in the order to list them */
            apps: APP_NAMES[];
        }
) => {
    const removeApps: AppSet = new Set();

    if (!options.isSpacesAvailable) {
        removeApps.add(APPS.PROTONSPACES);
    }

    const availableAppsByUser = getAvailableAppsByUser(options);
    const availableAppsByOrganization = getAvailableAppsByOrganization(options);
    const forbiddenApps = getForbiddenApps(options.user);
    return options.apps.filter((app) => {
        return (
            !removeApps.has(app) &&
            (availableAppsByUser?.has(app) ?? true) &&
            (availableAppsByOrganization?.has(app) ?? true) &&
            !forbiddenApps.has(app)
        );
    });
};
