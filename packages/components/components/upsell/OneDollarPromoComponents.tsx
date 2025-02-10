import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
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
    loading: boolean;
    amountDue?: number;
    currency?: string;
}

export const PriceCoupon = ({ loading, amountDue, currency }: PriceCouponProps) =>
    !loading && amountDue ? (
        <Price currency={currency} key="monthlyAmount">
            {amountDue}
        </Price>
    ) : (
        <CircleLoader size="small" />
    );
