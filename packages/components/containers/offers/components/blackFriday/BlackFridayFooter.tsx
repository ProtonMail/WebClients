import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import { getDiscount } from '../../helpers/dealPrices';
import { getRenewDescription } from '../../helpers/offerCopies';
import type { OfferProps } from '../../interface';

const BlackFridayFooter = ({ offer, currency }: OfferProps) => {
    return (
        <div className="mb-4">
            {offer.deals.map((deal) => {
                const { prices, cycle, dealName } = deal;
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

                // only display description for these 3 promos
                if (
                    !description ||
                    (offer?.ID !== 'black-friday-2024-inbox-free' &&
                        offer?.ID !== 'black-friday-2024-drive-free' &&
                        offer?.ID !== 'black-friday-2024-vpn-free')
                ) {
                    return null;
                }

                const key = `${dealName}-${cycle}`;

                return (
                    <p key={key} className="text-sm text-center color-weak">
                        {description}
                    </p>
                );
            })}

            {offer?.ID !== 'black-friday-2024-inbox-free' &&
                offer?.ID !== 'black-friday-2024-drive-free' &&
                offer?.ID !== 'black-friday-2024-vpn-free' && (
                    <p className="text-sm text-center color-weak">
                        <div>{c('BF2024: Footer').t`Discounts are based on standard monthly pricing.`}</div>
                        <div>{c('BF2024: Footer')
                            .t`Your subscription will automatically renew at the standard discounted rate and duration at the end of your billing cycle.`}</div>
                    </p>
                )}
        </div>
    );
};

export default BlackFridayFooter;
