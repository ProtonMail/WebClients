import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApiResult } from 'react-components';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

import Card from './Card';
import useCard from './useCard';
import PaymentMethodDetails from '../paymentMethods/PaymentMethodDetails';
import PayPal from './PayPal';
import Cash from './Cash';
import Bitcoin from './Bitcoin';

const { CARD, PAYPAL, BITCOIN, CASH } = PAYMENT_METHOD_TYPES;

const Method = ({ type, amount = 0, currency, onCard, onPayPal, method }) => {
    const { result = {} } = useApiResult(queryPaymentMethods, []);
    const { PaymentMethods = [] } = result;
    const { card, updateCard, errors, isValid } = useCard();

    useEffect(() => {
        onCard({ card, isValid });
    }, [card]);

    if (method === CARD) {
        return <Card card={card} errors={errors} onChange={updateCard} />;
    }

    if (method === CASH) {
        return <Cash />;
    }

    if (method === BITCOIN) {
        return <Bitcoin amount={amount} currency={currency} type={type} />;
    }

    if (method === PAYPAL) {
        return <PayPal amount={amount} currency={currency} onPay={onPayPal} type={type} />;
    }

    const { Details, Type } = PaymentMethods.find(({ ID }) => method === ID) || {};

    if (Details) {
        return <PaymentMethodDetails type={Type} details={Details} />;
    }

    return null;
};

Method.propTypes = {
    method: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit']),
    amount: PropTypes.number,
    onCard: PropTypes.func,
    onPayPal: PropTypes.func,
    currency: PropTypes.oneOf(['EUR', 'CHF', 'USD'])
};

export default Method;
