import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import Price from '@proton/components/components/price/Price';
import { getMaxCreditAmount, getMinPaypalAmountChargebee } from '@proton/payments/core/amount-limits';
import type { Currency } from '@proton/payments/core/interface';

interface Props {
    amount: number;
    currency: Currency;
}

export const PayPalView = ({ amount, currency, children }: PropsWithChildren<Props>) => {
    const minAmount = getMinPaypalAmountChargebee(currency);

    if (amount < minAmount) {
        const minimumAmount = (
            <Price currency={currency} key="minimum-amount">
                {minAmount}
            </Price>
        );

        return (
            <Banner className="mb-4" variant={BannerVariants.DANGER}>
                {c('Error').jt`Amount below minimum (${minimumAmount}).`}
            </Banner>
        );
    }

    if (amount > getMaxCreditAmount(currency)) {
        return (
            <Banner className="mb-4" variant={BannerVariants.DANGER}>{c('Error').t`Amount above the maximum.`}</Banner>
        );
    }

    return children;
};
