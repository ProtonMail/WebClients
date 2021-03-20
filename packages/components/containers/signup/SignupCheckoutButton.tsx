import React from 'react';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { SubscriptionCheckResponse } from 'proton-shared/lib/interfaces';
import { c } from 'ttag';

import { PrimaryButton } from '../../components';
import { SignupPayPal } from './interfaces';
import { PayPalButton } from '../payments';

interface Props {
    className?: string;
    paypal: SignupPayPal;
    canPay: boolean;
    loading: boolean;
    method: string;
    checkResult?: SubscriptionCheckResponse;
}

const SignupCheckoutButton = ({ className, paypal, canPay, loading, method, checkResult }: Props) => {
    if (method === PAYMENT_METHOD_TYPES.PAYPAL) {
        return (
            <PayPalButton
                paypal={paypal}
                color="norm"
                type="signup"
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

export default SignupCheckoutButton;
