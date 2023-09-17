import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Price } from '@proton/components/components';
import { useConfig } from '@proton/components/hooks';
import { getBlackFriday2023URL } from '@proton/shared/lib/helpers/url';

import { getDiscount } from '../../helpers/dealPrices';
import { getRenewDescription } from '../../helpers/offerCopies';
import { OfferProps } from '../../interface';

const BlackFridayFooter = ({ offer, currency }: OfferProps) => {
    const { APP_NAME } = useConfig();
    return (
        <div className="mb-4">
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

                if (!description || !star) {
                    return null;
                }

                const key = `${planName}-${cycle}`;

                return (
                    <p key={key} className="text-sm text-center color-weak">
                        <sup className="mr-2">{star}</sup>
                        {description}
                    </p>
                );
            })}
            <p className="text-sm text-center color-weak">
                <div>{c('bf2023: Footer').t`Discounts are based on standard monthly pricing.`}</div>
                <div>{c('bf2023: Footer')
                    .t`Your subscription will automatically renew at the standard discounted rate and duration at the end of your billing cycle.`}</div>
                <div>
                    <Href href={getBlackFriday2023URL(APP_NAME)}>{c('bf2023: Footer')
                        .t`Learn more about our Black Friday offers`}</Href>
                </div>
            </p>
        </div>
    );
};

export default BlackFridayFooter;
