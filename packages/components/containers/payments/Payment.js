import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    PAYMENT_METHOD_TYPES,
    MIN_DONATION_AMOUNT,
    MIN_CREDIT_AMOUNT,
    DEFAULT_CURRENCY,
    CURRENCIES,
} from 'proton-shared/lib/constants';

import { Radio, Icon, Row, Alert, Price, Loader } from '../../components';
import { classnames } from '../../helpers';
import { useMethods } from '../paymentMethods';
import Method from './Method';

const Payment = ({
    children,
    type,
    amount = 0,
    currency = DEFAULT_CURRENCY,
    coupon = '',
    paypal,
    paypalCredit,
    method,
    onMethod,
    card,
    onCard,
    errors,
}) => {
    const { methods, options, loading } = useMethods({ amount, coupon, type });
    const lastCustomMethod = [...options]
        .reverse()
        .find(
            ({ value }) =>
                ![
                    PAYMENT_METHOD_TYPES.CARD,
                    PAYMENT_METHOD_TYPES.PAYPAL,
                    PAYMENT_METHOD_TYPES.CASH,
                    PAYMENT_METHOD_TYPES.BITCOIN,
                ].includes(value)
        );

    useEffect(() => {
        const { value } = options.find(({ disabled }) => !disabled);
        onMethod(value);
    }, [options.length]);

    if (['donation', 'human-verification'].includes(type) && amount < MIN_DONATION_AMOUNT) {
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

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <Row className="payment-container">
                <div className="pm-label payment-left mr1 onmobile-mr0">
                    <label className="mb0-5 bl">{c('Label').t`Select a method`}</label>
                    {options.map(({ text, value, disabled, icon }) => {
                        return (
                            <label
                                htmlFor={value}
                                key={value}
                                className={classnames([
                                    'pt0-5 pb0-5 flex flex-nowrap flex-items-center',
                                    lastCustomMethod && lastCustomMethod.value === value && 'border-bottom',
                                ])}
                            >
                                <Radio
                                    disabled={loading || disabled}
                                    className="mr0-5"
                                    id={value}
                                    checked={value === method}
                                    onChange={() => onMethod(value)}
                                />
                                <Icon className="mr0-5" name={icon} />
                                <span className="cut">{text}</span>
                            </label>
                        );
                    })}
                </div>
                <div className="payment-right mr0-25">
                    <div className="mw37e onmobile-mw100">
                        <Method
                            loading={loading}
                            paypal={paypal}
                            paypalCredit={paypalCredit}
                            amount={amount}
                            currency={currency}
                            onCard={onCard}
                            card={card}
                            type={type}
                            method={method}
                            methods={methods}
                            errors={errors}
                        />
                        {children}
                    </div>
                </div>
            </Row>
        </>
    );
};

Payment.propTypes = {
    children: PropTypes.node,
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit', 'human-verification']),
    amount: PropTypes.number.isRequired,
    coupon: PropTypes.string,
    currency: PropTypes.oneOf(CURRENCIES),
    card: PropTypes.object,
    onCard: PropTypes.func,
    method: PropTypes.string,
    onMethod: PropTypes.func,
    errors: PropTypes.object,
    paypal: PropTypes.object,
    paypalCredit: PropTypes.object,
};

export default Payment;
