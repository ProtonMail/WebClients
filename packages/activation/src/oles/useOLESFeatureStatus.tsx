import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import { ImportProvider } from '../interface';
import { isOrganizationOLESEligible, isUserOLESEligible } from './eligibility';
import { type SupportedProvider, isProviderSupported } from './providers';

const useOLESFeatureStatus = () => {
    const [user, userLoading] = useUser();
    const [organization, organizationLoading] = useOrganization();
    const [subscription, subscriptionLoading] = useSubscription();
    const clientFlag: boolean = useFlag('OrganizationLevelEasySwitch');
    const microsoftFlag: boolean = useFlag('Oles365');

    const featureSupported = isOrganizationOLESEligible({ organization });
    const creatingEnabled = featureSupported && Boolean(clientFlag);
    const allowedForUser = isUserOLESEligible({ user, organization, subscription });
    const loading = userLoading || organizationLoading || subscriptionLoading;

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
