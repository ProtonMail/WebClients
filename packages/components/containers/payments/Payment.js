import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Label, Row, Field, Alert, Price } from 'react-components';
import { CYCLE, PAYMENT_METHOD_TYPES, MIN_DONATION_AMOUNT, MIN_CREDIT_AMOUNT } from 'proton-shared/lib/constants';

import Method from './Method';
import toDetails from './toDetails';
import PaymentMethodsSelect from '../paymentMethods/PaymentMethodsSelect';
import useMethods from '../paymentMethods/useMethods';

const { CARD, PAYPAL, CASH, BITCOIN } = PAYMENT_METHOD_TYPES;

const Payment = ({
    children,
    type,
    amount,
    currency,
    coupon,
    cycle,
    onParameters,
    method,
    onMethod,
    onValidCard,
    onPay,
    fieldClassName,
    card
}) => {
    const { methods, options, loading } = useMethods({ amount, coupon, type });

    const handleCard = ({ card, isValid }) => {
        onValidCard(isValid);
        isValid && onParameters({ Payment: { Type: CARD, Details: toDetails(card) } });
    };

    const handleChangeMethod = (newMethod) => {
        onMethod(newMethod);

        if (![CARD, PAYPAL, CASH, BITCOIN].includes(newMethod)) {
            onParameters({ PaymentMethodID: newMethod });
        }
    };

    if (type === 'donation' && amount < MIN_DONATION_AMOUNT) {
        const price = (
            <Price key="price" currency={currency}>
                {MIN_DONATION_AMOUNT}
            </Price>
        );
        return <Alert type="error">{c('Error').jt`The minimum amount that can be donated is ${price}`}</Alert>;
    }

    if (type === 'credit' && amount < MIN_CREDIT_AMOUNT) {
        const price = (
            <Price key="price" currency={currency}>
                {MIN_CREDIT_AMOUNT}
            </Price>
        );
        return <Alert type="error">{c('Error').jt`The minimum amount of credit that can be added is ${price}`}</Alert>;
    }

    if (amount <= 0) {
        const price = (
            <Price key="price" currency={currency}>
                {0}
            </Price>
        );
        return <Alert type="error">{c('Error').jt`The minimum payment we accept is ${price}`}</Alert>;
    }

    return (
        <>
            <Row>
                <Label>{c('Label').t`Payment method`}</Label>
                <Field className={fieldClassName}>
                    <div className="mb1">
                        <PaymentMethodsSelect
                            loading={loading}
                            cycle={cycle}
                            method={method}
                            methods={options}
                            amount={amount}
                            type={type}
                            onChange={handleChangeMethod}
                        />
                    </div>
                    <Method
                        loading={loading}
                        amount={amount}
                        currency={currency}
                        onCard={handleCard}
                        onPayPal={onPay}
                        card={card}
                        type={type}
                        method={method}
                        methods={methods}
                    />
                    {children}
                </Field>
            </Row>
        </>
    );
};

Payment.propTypes = {
    children: PropTypes.node,
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit']),
    amount: PropTypes.number.isRequired,
    coupon: PropTypes.string,
    currency: PropTypes.oneOf(['EUR', 'CHF', 'USD']),
    parameters: PropTypes.object,
    card: PropTypes.object,
    onParameters: PropTypes.func,
    method: PropTypes.string,
    onMethod: PropTypes.func,
    onValidCard: PropTypes.func,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS]),
    onPay: PropTypes.func,
    fieldClassName: PropTypes.string
};

export default Payment;
