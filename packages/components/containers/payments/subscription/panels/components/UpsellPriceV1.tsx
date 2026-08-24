import { c } from 'ttag';

import { OfferPrice } from '@proton/payments/ui/components/OfferPrice';

import Price from '../../../../../components/price/Price';
import type { UpsellWithPlan } from '../../helpers/index';

const UpsellPrice = ({ upsell }: { upsell: UpsellWithPlan }) => {
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
                    planIDs: upsell.planIDs,
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
