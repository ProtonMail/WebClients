import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import type { Upsell } from '@proton/components/containers/payments/subscription/helpers';
import { OfferPrice } from '@proton/payments/ui';

const UpsellPrice = ({ upsell }: { upsell: Upsell }) => {
    if (!upsell.price) {
        return null;
    }

    const { value, currency } = upsell.price;

    if (upsell.plan && upsell.cycle) {
        return (
            <OfferPrice
                key="offer-price"
                planToCheck={{
                    currency,
                    planIDs: {
                        [upsell.plan]: 1,
                    },
                    cycle: upsell.cycle,
                }}
                suffix={c('new_plans: Plan frequency').t`/month`}
            />
        );
    }

    return (
        <Price key="plan-price" currency={currency} suffix={c('new_plans: Plan frequency').t`/month`}>
            {value}
        </Price>
    );
};

export default UpsellPrice;
