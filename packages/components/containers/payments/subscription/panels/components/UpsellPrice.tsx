import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { OfferPrice } from '@proton/payments/ui';

import type { UpsellWithPlan } from '../../helpers';

interface UpsellPriceProps {
    upsell: UpsellWithPlan;
}

const getCycleSuffix = (upsell: UpsellWithPlan) => {
    if (getIsB2BAudienceFromPlan(upsell.plan)) {
        return c('Cycle').t`/user /month`;
    }
    return c('new_plans: Plan frequency').t`/month`;
};

const UpsellPrice = ({ upsell }: UpsellPriceProps) => {
    const priceColorClassName = upsell.highlightPrice ? 'text-5xl color-primary' : 'text-5xl color-norm';
    const { value, currency } = upsell.price;
    const suffix = getCycleSuffix(upsell);

    if (upsell.plan && upsell.customCycle) {
        return (
            <OfferPrice
                planToCheck={{ planIDs: upsell.planIDs, cycle: upsell.customCycle, currency }}
                suffix={suffix}
                wrapperClassName="text-semibold"
                currencyClassName={priceColorClassName}
                amountClassName={priceColorClassName}
                suffixClassName="color-norm"
                autosizeSkeletonLoader={false}
                skeletonLoaderProps={{
                    width: '10em',
                    height: '2.70em',
                }}
            />
        );
    }

    return (
        <Price
            key="plan-price"
            wrapperClassName="text-semibold"
            currencyClassName={priceColorClassName}
            amountClassName={priceColorClassName}
            suffixClassName="color-norm"
            currency={currency}
            suffix={suffix}
        >
            {value}
        </Price>
    );
};

export default UpsellPrice;
