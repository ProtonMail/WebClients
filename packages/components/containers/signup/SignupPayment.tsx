import React from 'react';
import { c } from 'ttag';
import { PAYMENT_METHOD_TYPE, PLAN_SERVICES } from 'proton-shared/lib/constants';
import { Plan, SubscriptionCheckResponse } from 'proton-shared/lib/interfaces';

import { Alert } from '../../components';
import { SubscriptionCheckout, Payment } from '../payments';
import { SignupModel, SignupPayPal } from './interfaces';
import SignupCheckoutButton from './SignupCheckoutButton';

interface Props {
    model: SignupModel;
    checkResult: SubscriptionCheckResponse;
    onChange: (model: SignupModel) => void;
    card: any;
    onCardChange: (key: string, value: string) => void;
    paypal: SignupPayPal;
    paypalCredit: SignupPayPal;
    method: any;
    onMethodChange: (method: PAYMENT_METHOD_TYPE) => void;
    errors: any;
    canPay: boolean;
    loading: boolean;
    plans?: Plan[];
    service: PLAN_SERVICES;
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
    service,
}: Props) => {
    return (
        <form name="payment-form" onSubmit={onSubmit} method="post">
            <Alert>{c('Info')
                .t`Please note that depending on the total amount due, some payment options may not be available.`}</Alert>
            <div className="flex-no-min-children flex-nowrap on-mobile-flex-column on-mobile-flex-wrap">
                <div className="flex-item-fluid no-min-dimensions on-mobile-w100 pr1 on-mobile-pr0">
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
                <div className="w25 min-w14e on-mobile-w100">
                    <SubscriptionCheckout
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
                        service={service}
                        checkResult={checkResult}
                        loading={loading}
                        currency={model.currency}
                        cycle={model.cycle}
                        planIDs={model.planIDs}
                        onChangeCurrency={(currency) => onChange({ ...model, currency })}
                        onChangeCycle={(cycle) => onChange({ ...model, cycle })}
                    />
                </div>
            </div>
        </form>
    );
};

export default SignupPayment;
