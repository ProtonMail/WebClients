import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Label, Row } from 'react-components';
import { CYCLE } from 'proton-shared/lib/constants';

import Method from './Method';
import PaymentMethodsSelect from '../paymentMethods/PaymentMethodsSelect';
import toDetails from './toDetails';

const Payment = ({ type, amount, currency, cycle, onParameters, onMethod, onValidCard }) => {
    const [method, setMethod] = useState('');
    const [parameters, setParameters] = useState({});
    const handlePayPal = (Details) => setParameters({ Payment: { Type: 'paypal', Details } });

    const handleCard = ({ card, isValid }) => {
        onValidCard(isValid);
        isValid && setParameters({ Payment: { Type: 'card', Details: toDetails(card) } });
    };

    const handleChangeMethod = (newMethod) => {
        setMethod(newMethod);

        if (!['card', 'paypal', 'cash', 'bitcoin'].includes(newMethod)) {
            setParameters({ PaymentMethodID: newMethod });
        }
    };

    useEffect(() => {
        onParameters(parameters);
    }, [parameters]);

    useEffect(() => {
        onMethod(method);
    }, [method]);

    return (
        <>
            <Row>
                <Label>{c('Label').t`Select payment method`}</Label>
                <PaymentMethodsSelect
                    cycle={cycle}
                    method={method}
                    amount={amount}
                    type={type}
                    onChange={handleChangeMethod}
                />
            </Row>
            <Method
                amount={amount}
                currency={currency}
                onCard={handleCard}
                onPayPal={handlePayPal}
                type={type}
                method={method}
            />
        </>
    );
};

Payment.propTypes = {
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit']),
    amount: PropTypes.number.isRequired,
    currency: PropTypes.oneOf(['EUR', 'CHF', 'USD']),
    onParameters: PropTypes.func,
    onMethod: PropTypes.func,
    onValidCard: PropTypes.func,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEAR])
};

export default Payment;
