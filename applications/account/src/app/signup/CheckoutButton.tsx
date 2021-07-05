import React from 'react';
import { PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import { PrimaryButton, PayPalButton } from '@proton/components';
import { SignupPayPal } from './interfaces';

interface Props {
    className?: string;
    paypal: SignupPayPal;
    canPay: boolean;
    loading: boolean;
    method?: PAYMENT_METHOD_TYPE;
    checkResult?: SubscriptionCheckResponse;
}

const CheckoutButton = ({ className, paypal, canPay, loading, method, checkResult }: Props) => {
    if (method === PAYMENT_METHOD_TYPES.PAYPAL) {
        return (
            <PayPalButton
                paypal={paypal}
                flow="signup"
                color="norm"
                className={className}
                amount={checkResult ? checkResult.AmountDue : 0}
            >{c('Action').t`Pay`}</PayPalButton>
        );
    }

    if (checkResult && !checkResult.AmountDue) {
        return (
            <PrimaryButton className={className} loading={loading} disabled={!canPay} type="submit">{c('Action')
                .t`Confirm`}</PrimaryButton>
        );
    }

    return (
        <PrimaryButton className={className} loading={loading} disabled={!canPay} type="submit">{c('Action')
            .t`Pay`}</PrimaryButton>
    );
};

export default CheckoutButton;
