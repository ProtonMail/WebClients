import React from 'react';
import { c } from 'ttag';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { Plan } from 'proton-shared/lib/interfaces';

import { Alert } from '../../components';
import { SubscriptionCheckout, Payment } from '../payments';
import { SignupModel, SignupPayPal, SubscriptionCheckResult } from './interfaces';
import SignupCheckoutButton from './SignupCheckoutButton';

interface Props {
    model: SignupModel;
    checkResult: SubscriptionCheckResult;
    onChange: (model: SignupModel) => void;
    card: any;
    onCardChange: (key: string, value: string) => void;
    paypal: SignupPayPal;
    paypalCredit: SignupPayPal;
    method: any;
    onMethodChange: (method: PAYMENT_METHOD_TYPES) => void;
    errors: any;
    canPay: boolean;
    loading: boolean;
    plans?: Plan[];
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const SignupPayment = ({
    plans,
    checkResult,
    model,
    onChange,
    card,
    onCardChange,
    paypal,
    paypalCredit,
    canPay,
    method,
    onMethodChange,
    errors,
    loading,
    onSubmit,
}: Props) => {
    return (
        <form name="payment-form" onSubmit={onSubmit} method="post">
            <Alert>{c('Info')
                .t`Please note that depending on the total amount due, some payment options may not be available.`}</Alert>
            <div className="flex-noMinChildren flex-nowrap onmobile-flex-column onmobile-flex-wrap">
                <div className="flex-item-fluid no-min-dims onmobile-w100 pr1 onmobile-pr0">
                    <Payment
                        type="signup"
                        paypal={paypal}
                        paypalCredit={paypalCredit}
                        method={method}
                        amount={checkResult.AmountDue}
                        currency={model.currency}
                        card={card}
                        onMethod={onMethodChange}
                        onCard={onCardChange}
                        errors={errors}
                    />
                </div>
                <div className="w25 min-w14e onmobile-w100">
                    <SubscriptionCheckout
                        method={method}
                        submit={
                            <SignupCheckoutButton
                                loading={loading}
                                canPay={canPay}
                                paypal={paypal}
                                method={method}
                                checkResult={checkResult}
                                className="w100"
                            />
                        }
                        plans={plans}
                        checkResult={checkResult}
                        loading={loading}
                        model={model}
                        setModel={onChange}
                    />
                </div>
            </div>
        </form>
    );
};

export default SignupPayment;
