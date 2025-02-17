import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

interface PriceLineProps {
    planPrice: number;
    currency?: string;
}

export const PriceLine = ({ planPrice, currency }: PriceLineProps) => (
    <Price key="monthly-price" currency={currency} suffix={c('specialoffer: Offers').t`/month`} isDisplayedInSentence>
        {planPrice}
    </Price>
);

interface PriceCouponProps {
    amountDue: number;
    currency?: string;
}

export const PriceCoupon = ({ amountDue, currency }: PriceCouponProps) => (
    <Price currency={currency} key="monthlyAmount">
        {amountDue}
    </Price>
);
