import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useMember } from '@proton/account/member/hook';
import { MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';

export const useCanBuyLumoCredits = () => {
    const { allowPurchasingCredits } = useLumoFlags();
    const [member] = useMember();
    const [entitlements] = useEntitlementChecksForOrgAndUser();

    return allowPurchasingCredits && member?.Subscriber === MEMBER_SUBSCRIBER.PAYER && entitlements.hasLumoCredits;
};
