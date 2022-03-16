import PropTypes from 'prop-types';
import {
    Alert,
    Payment,
    usePayment,
    PrimaryButton,
    Field,
    Row,
    useLoading,
    SubTitle,
    StyledPayPalButton,
} from '@proton/components';
import { c } from 'ttag';
import { PAYMENT_METHOD_TYPES, CYCLE, CURRENCIES } from '@proton/shared/lib/constants';

import LoginPanel from '../LoginPanel';

const PaymentStep = ({ onPay, paymentAmount, model, children }) => {
    const [loading, withLoading] = useLoading();
    const { card, setCard, cardErrors, handleCardSubmit, method, setMethod, parameters, canPay, paypal, paypalCredit } =
        usePayment({
            amount: paymentAmount,
            currency: model.currency,
            onPay(params) {
                withLoading(onPay(model, params));
            },
        });

    return (
        <div className="pt2 mb2">
            <SubTitle>{c('Title').t`Provide payment details`}</SubTitle>
            <Row>
                <div>
                    <Alert className="mb1">{c('Info')
                        .t`Your payment details are protected with TLS encryption and Swiss laws`}</Alert>
                    <Payment
                        fieldClassName="wauto flex-item-fluid-auto"
                        type="signup"
                        method={method}
                        amount={paymentAmount}
                        currency={model.currency}
                        card={card}
                        onMethod={setMethod}
                        onCard={setCard}
                        cardErrors={cardErrors}
                        paypal={paypal}
                        paypalCredit={paypalCredit}
                    >
                        {method === PAYMENT_METHOD_TYPES.CARD && (
                            <Field>
                                <PrimaryButton
                                    loading={loading}
                                    disabled={!canPay}
                                    onClick={() => {
                                        if (!handleCardSubmit()) {
                                            return;
                                        }
                                        withLoading(
                                            onPay(model, {
                                                ...parameters,
                                                type: PAYMENT_METHOD_TYPES.CARD,
                                            })
                                        );
                                    }}
                                >{c('Action').t`Confirm payment`}</PrimaryButton>
                            </Field>
                        )}
                        {method === PAYMENT_METHOD_TYPES.PAYPAL && (
                            <Field>
                                <StyledPayPalButton paypal={paypal} amount={paymentAmount} />
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
        currency: PropTypes.oneOf(CURRENCIES).isRequired,
    }),
    onPay: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
};

export default PaymentStep;
