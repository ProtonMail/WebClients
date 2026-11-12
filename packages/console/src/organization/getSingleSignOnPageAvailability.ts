import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { appSupportsSSO } from '@proton/shared/lib/apps/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';
import { getHasSsoUpsell, getIsSsoAvailable } from '@proton/shared/lib/payments/plan/helpers';

// The condition under which Account and Console show the Single sign-on page.
export const getSingleSignOnPageAvailability = ({
    app,
    organization,
    entitlements,
    permissions,
    allSubscriptions,
    isSsoForPbsEnabled,
}: {
    app: APP_NAMES;
    organization: OrganizationExtended | undefined;
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'hasSso'>;
    permissions: Pick<OrgPermissions, 'account.sso_config.read'>;
    allSubscriptions: Subscription[];
    isSsoForPbsEnabled: boolean;
}) => {
    const isOrgConfigured = hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);
    const isSsoAvailable = getIsSsoAvailable({
        hasSso: entitlements.hasSso,
        subscriptions: allSubscriptions,
        isSsoForPbsEnabled,
    });
    const hasSsoUpsell = getHasSsoUpsell(allSubscriptions);

    return {
        singleSignOn:
            !!permissions['account.sso_config.read'] &&
            appSupportsSSO(app) &&
            (isSsoAvailable || hasSsoUpsell) &&
            isOrgConfigured,
        upgradeRequired: !isSsoAvailable && hasSsoUpsell,
    };
};
