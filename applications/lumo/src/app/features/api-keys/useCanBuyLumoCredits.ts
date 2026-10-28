import { useMember } from '@proton/account/member/hook';
import { MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';

export const useCanBuyLumoCredits = () => {
    const { allowPurchasingCredits } = useLumoFlags();
    const [member] = useMember();

    // TODO: also require EntitlementName.LumoCredits once it is generated (add 'lumo-credits' to releaseCandidates)
    return allowPurchasingCredits && member?.Subscriber === MEMBER_SUBSCRIBER.PAYER;
};
