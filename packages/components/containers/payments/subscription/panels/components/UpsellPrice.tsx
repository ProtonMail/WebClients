import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { OfferPrice } from '@proton/payments/ui';

import { type Upsell } from '../../helpers';

interface UpsellPriceProps {
    upsell: Upsell;
}

const UpsellPrice = ({ upsell }: UpsellPriceProps) => {
    if (!upsell.price) {
        return null;
    }

    const priceColorClassName = upsell.highlightPrice ? 'text-5xl color-primary' : 'text-5xl color-norm';
    const { value, currency } = upsell.price;

    if (upsell.plan && upsell.customCycle) {
        return (
            <OfferPrice
                planToCheck={{ planIDs: { [upsell.plan]: 1 }, cycle: upsell.customCycle, currency }}
                suffix={c('new_plans: Plan frequency').t`/month`}
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
            suffix={c('new_plans: Plan frequency').t`/month`}
        >
            {value}
        </Price>
    );
};

export default UpsellPrice;
