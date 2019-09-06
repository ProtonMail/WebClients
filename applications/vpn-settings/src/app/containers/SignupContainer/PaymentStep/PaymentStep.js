import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Payment, usePayment, PrimaryButton, Field, Label, Row, useLoading, SubTitle } from 'react-components';
import { c } from 'ttag';
import { PAYMENT_METHOD_TYPES, CYCLE, CURRENCIES } from 'proton-shared/lib/constants';

const PaymentStep = ({ onPaymentDone, paymentAmount, model, children }) => {
    const [loading, withLoading] = useLoading();
    const { method, setMethod, parameters, canPay, setParameters, setCardValidity } = usePayment();

    const handlePaymentDone = () => withLoading(onPaymentDone(model, parameters));

    return (
        <>
            <SubTitle>{c('Title').t`Provide payment details`}</SubTitle>
            <Row>
                <div>
                    <Alert>{c('Info').t`Your payment details are protected with TLS encryption and Swiss laws`}</Alert>
                    <Payment
                        type="signup"
                        method={method}
                        amount={paymentAmount}
                        cycle={model.cycle}
                        currency={model.currency}
                        parameters={parameters}
                        onParameters={setParameters}
                        onMethod={setMethod}
                        onValidCard={setCardValidity}
                        onPay={handlePaymentDone}
                    />
                    {method === PAYMENT_METHOD_TYPES.CARD && (
                        <Row>
                            <Label></Label>
                            <Field>
                                <PrimaryButton loading={loading} disabled={!canPay} onClick={handlePaymentDone}>{c(
                                    'Action'
                                ).t`Confirm payment`}</PrimaryButton>
                            </Field>
                        </Row>
                    )}
                </div>
                {children}
            </Row>
        </>
    );
};

PaymentStep.propTypes = {
    paymentAmount: PropTypes.number.isRequired,
    model: PropTypes.shape({
        cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]).isRequired,
        currency: PropTypes.oneOf(CURRENCIES).isRequired
    }),
    onPaymentDone: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default PaymentStep;
