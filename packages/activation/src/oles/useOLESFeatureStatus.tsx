import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import { ImportProvider } from '../interface';
import { isOrganizationOLESEligible, isUserOLESEligible } from './eligibility';
import { type SupportedProvider, isProviderSupported } from './providers';

const useOLESFeatureStatus = () => {
    const [user, userLoading] = useUser();
    const [organization, organizationLoading] = useOrganization();
    const [entitlements, entitlementsLoading] = useEntitlementChecksForOrgAndUser();
    const [{ permissions }, permissionsLoading] = useUserPermissions();
    const clientFlag: boolean = useFlag('OrganizationLevelEasySwitch');
    const microsoftFlag: boolean = useFlag('Oles365');

    const featureSupported = isOrganizationOLESEligible({ organization, entitlements });
    const creatingEnabled = featureSupported && Boolean(clientFlag);
    const allowedForUser = isUserOLESEligible({
        user,
        organization,
        entitlements,
        hasOrgMigrationPermission: Boolean(permissions?.['account.easy_switch.update']),
    });
    const loading = userLoading || organizationLoading || entitlementsLoading || permissionsLoading;

    const isProviderEnabled = (provider: string | ImportProvider): provider is SupportedProvider => {
        if (!isProviderSupported(provider)) {
            return false;
        }

        if (provider === ImportProvider.OUTLOOK) {
            return microsoftFlag;
        }

        return true;
    };

    return {
        featureSupported,
        creatingEnabled,
        allowedForUser,
        isProviderEnabled,
        loading,
    } as const;
};

export default useOLESFeatureStatus;
