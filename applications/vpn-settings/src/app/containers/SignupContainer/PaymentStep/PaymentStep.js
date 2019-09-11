import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Payment, usePayment, PrimaryButton, Field, Row, useLoading, SubTitle } from 'react-components';
import { c } from 'ttag';
import { PAYMENT_METHOD_TYPES, CYCLE, CURRENCIES } from 'proton-shared/lib/constants';

import LoginPanel from '../LoginPanel';

const PaymentStep = ({ onPay, paymentAmount, model, children }) => {
    const [loading, withLoading] = useLoading();
    const { method, setMethod, parameters, canPay, setParameters, setCardValidity } = usePayment();

    return (
        <div className="pt2 mb2">
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
                        onPay={(params) => withLoading(onPay(model, params))}
                        fieldClassName="auto flex-item-fluid-auto"
                    >
                        {method === PAYMENT_METHOD_TYPES.CARD && (
                            <Field>
                                <PrimaryButton
                                    loading={loading}
                                    disabled={!canPay}
                                    onClick={() => withLoading(onPay(model, parameters))}
                                >{c('Action').t`Confirm payment`}</PrimaryButton>
                            </Field>
                        )}
                    </Payment>
                    <LoginPanel />
                </div>
                {children}
            </Row>
        </div>
    );
};

PaymentStep.propTypes = {
    paymentAmount: PropTypes.number.isRequired,
    model: PropTypes.shape({
        cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]).isRequired,
        currency: PropTypes.oneOf(CURRENCIES).isRequired
    }),
    onPay: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default PaymentStep;
