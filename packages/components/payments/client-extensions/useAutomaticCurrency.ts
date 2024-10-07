import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useUser } from '@proton/account/user/hooks';
import { usePlans, useSubscription } from '@proton/components/hooks';

import { useCurrencies } from './useCurrencies';

export const useAutomaticCurrency = () => {
    const { getPreferredCurrency } = useCurrencies();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [plans] = usePlans();
    const [status] = usePaymentStatus();

    return getPreferredCurrency({
        user,
        plans: plans?.plans,
        status,
        subscription,
    });
};
