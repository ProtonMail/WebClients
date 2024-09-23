import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { useUser } from '@proton/components/hooks';
import { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

const useOneDollarConfig = () => {
    const [user] = useUser();
    const currency: Currency = user?.Currency || 'USD';
    const ABTestInboxUpsellOneDollarEnabled = useFlag('ABTestInboxUpsellOneDollar');

    if (ABTestInboxUpsellOneDollarEnabled) {
        const price = (
            <Price currency={currency} key="monthlyAmount">
                1
            </Price>
        );

        return {
            submitText: c('new_plans: Action').jt`Get started for ${price}`,
            title: c('new_plans: Title').jt`Get Mail Plus for ${price}`,
            cycle: CYCLE.MONTHLY,
            coupon: COUPON_CODES.TRYMAILPLUS0724,
        };
    }

    return {};
};

export default useOneDollarConfig;
