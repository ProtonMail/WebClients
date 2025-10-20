import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { CYCLE, DEFAULT_CURRENCY, PLANS, getPlanByName } from '@proton/payments/index';

import type { UnlimitedToDuoConfig } from '../helpers/interface';

// TODO: add more details to the config for dynamic modal information
export const useUnlimitedToDuoConfig = (): UnlimitedToDuoConfig => {
    const [user] = useUser();
    const [plansResults] = usePlans();

    const currency = user?.Currency || DEFAULT_CURRENCY;
    const duoPlan = getPlanByName(plansResults?.plans ?? [], PLANS.DUO, currency);
    const price = (duoPlan?.Pricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    return {
        currency: currency,
        price: price,
    };
};
