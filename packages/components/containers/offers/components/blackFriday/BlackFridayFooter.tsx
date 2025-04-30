import Price from '@proton/components/components/price/Price';

import { getDiscount } from '../../helpers/dealPrices';
import { getRenewDescription } from '../../helpers/offerCopies';
import type { OfferProps } from '../../interface';

const BlackFridayFooter = ({ offer, currency }: OfferProps) => {
    return (
        <div className="mb-4">
            {offer.deals.map((deal) => {
                const { prices, cycle, dealName, planIDs } = deal;
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
                const description = getRenewDescription(cycle, discountedAmount, regularAmount, discount, planIDs);

                if (!description) {
                    return null;
                }

                const key = `${dealName}-${cycle}`;

                return (
                    <p key={key} className="text-sm text-center color-weak">
                        {description}
                    </p>
                );
            })}
        </div>
    );
};

export default BlackFridayFooter;
