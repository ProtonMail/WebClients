import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import Price from '@proton/components/components/price/Price';
import { type Currency, PAYMENT_METHOD_TYPES, type PlainPaymentMethodType } from '@proton/payments';
import {
    getMaxCreditAmount,
    getMinPaypalAmountChargebee,
    getMinPaypalAmountInhouse,
} from '@proton/payments/core/amount-limits';

interface Props {
    amount: number;
    currency: Currency;
    method: PlainPaymentMethodType;
}

const PayPalView = ({ amount, currency, method, children }: PropsWithChildren<Props>) => {
    const isChargebeePaypal = method === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    const minAmount = isChargebeePaypal ? getMinPaypalAmountChargebee(currency) : getMinPaypalAmountInhouse(currency);

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

export default PayPalView;
