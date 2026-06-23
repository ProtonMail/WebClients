import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import { isOrganizationOLESEligible, isUserOLESEligible } from './eligibility';

const useOLESFeatureStatus = () => {
    const [user, userLoading] = useUser();
    const [organization, organizationLoading] = useOrganization();
    const [subscription, subscriptionLoading] = useSubscription();
    const backendFlag: boolean = useFlag('OlesM1');
    const clientFlag: boolean = useFlag('OrganizationLevelEasySwitch');

    const featureSupported = Boolean(backendFlag) && isOrganizationOLESEligible({ organization });
    const creatingEnabled = featureSupported && Boolean(clientFlag);
    const allowedForUser = isUserOLESEligible({ user, organization, subscription });
    const loading = userLoading || organizationLoading || subscriptionLoading;

    return {
        featureSupported,
        creatingEnabled,
        allowedForUser,
        loading,
    } as const;
};

export default useOLESFeatureStatus;
