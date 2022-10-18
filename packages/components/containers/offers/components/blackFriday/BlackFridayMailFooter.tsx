import { Price } from '@proton/components/components';

import { getDiscount } from '../../helpers/dealPrices';
import { getRenewDescription } from '../../helpers/offerCopies';
import { OfferProps } from '../../interface';

const BlackFridayMailFooter = ({ offer, currency }: OfferProps) => {
    return (
        <div className="mb1">
            {offer.deals.map((deal) => {
                const { withoutCoupon = 0, withoutCouponMonthly = 0 } = deal.prices || {};
                const discount = getDiscount(deal);
                const discountedAmount = (
                    <Price key="discounted-amount" currency={currency} isDisplayedInSentence>
                        {withoutCoupon}
                    </Price>
                );
                const regularAmount = (
                    <Price key="regular-amount" currency={currency} isDisplayedInSentence>
                        {withoutCouponMonthly}
                    </Price>
                );
                const description = getRenewDescription(deal.cycle, discountedAmount, regularAmount, discount);

                if (!description) {
                    return null;
                }

                const key = `${deal.planName}-${deal.cycle}`;

                return (
                    <p key={key} className="text-sm text-center color-weak">
                        {deal.star ? <sup className="mr0-5">{deal.star}</sup> : null}
                        {description}
                    </p>
                );
            })}
        </div>
    );
};

export default BlackFridayMailFooter;
