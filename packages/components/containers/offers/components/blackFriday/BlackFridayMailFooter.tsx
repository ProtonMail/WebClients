import { c } from 'ttag';

import { Price } from '@proton/components/components';

import { getDiscount } from '../../helpers/dealPrices';
import { getRenewDescription } from '../../helpers/offerCopies';
import { OfferProps } from '../../interface';

const BlackFridayMailFooter = ({ offer, currency }: OfferProps) => {
    return (
        <div className="mb1">
            {offer.deals.map((deal) => {
                const { prices, cycle, planName, star } = deal;
                const { withoutCoupon = 0, withoutCouponMonthly = 0 } = prices || {};
                const discount = getDiscount(deal);
                const discountedAmount = (
                    <Price key="discounted-amount" currency={currency} isDisplayedInSentence>
                        {withoutCoupon}
                    </Price>
                );
                const regularAmount = (
                    <Price key="regular-amount" currency={currency} isDisplayedInSentence>
                        {withoutCouponMonthly * cycle}
                    </Price>
                );
                const description = getRenewDescription(cycle, discountedAmount, regularAmount, discount);

                if (!description) {
                    return null;
                }

                const key = `${planName}-${cycle}`;

                return (
                    <p key={key} className="text-sm text-center color-weak">
                        {star ? <sup className="mr0-5">{star}</sup> : null}
                        {description}
                    </p>
                );
            })}
            <p className="text-sm text-center color-weak">{c('specialoffer: Footer')
                .t`Discounts are based on the standard monthly pricing.`}</p>
        </div>
    );
};

export default BlackFridayMailFooter;
