import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { Loader } from 'react-components';

import Card from './Card';
import PaymentMethodDetails from '../paymentMethods/PaymentMethodDetails';
import PayPal from './PayPal';
import Cash from './Cash';
import Bitcoin from './Bitcoin';

const { CARD, PAYPAL, BITCOIN, CASH } = PAYMENT_METHOD_TYPES;

const Method = ({ type, amount = 0, currency, onCard, onPayPal, method, methods, loading, card: cardToUse }) => {
    const { card, updateCard, errors, isValid } = cardToUse;

    useEffect(() => {
        onCard({ card, isValid });
    }, [card]);

    if (loading) {
        return <Loader />;
    }

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

    const { Details, Type } = methods.find(({ ID }) => method === ID) || {};

    if (Details) {
        return <PaymentMethodDetails type={Type} details={Details} />;
    }

    return null;
};

Method.propTypes = {
    loading: PropTypes.bool,
    method: PropTypes.string.isRequired,
    methods: PropTypes.array,
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit']),
    amount: PropTypes.number,
    card: PropTypes.object.isRequired,
    onCard: PropTypes.func,
    onPayPal: PropTypes.func,
    currency: PropTypes.oneOf(['EUR', 'CHF', 'USD'])
};

export default Method;
