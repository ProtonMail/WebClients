import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApiResult } from 'react-components';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';

import Card from './Card';
import useCard from './useCard';
import PaymentMethodDetails from '../paymentMethods/PaymentMethodDetails';
import PayPal from './PayPal';
import Cash from './Cash';
import Bitcoin from './Bitcoin';

const Method = ({ type, amount, currency, onCard, onPayPal, method }) => {
    const { result = {} } = useApiResult(queryPaymentMethods, []);
    const { PaymentMethods = [] } = result;
    const { card, updateCard, errors, isValid } = useCard();

    const render = () => {
        switch (method) {
            case 'card':
                return <Card card={card} errors={errors} onChange={updateCard} />;
            case 'cash':
                return <Cash />;
            case 'bitcoin':
                return <Bitcoin amount={amount} currency={currency} type={type} />;
            case 'paypal':
                return <PayPal amount={amount} currency={currency} onPay={onPayPal} type={type} />;
            default: {
                const { Details, Type } = PaymentMethods.find(({ ID }) => method === ID) || {};

                if (Details) {
                    return <PaymentMethodDetails type={Type} details={Details} />;
                }

                return null;
            }
        }
    };

    useEffect(() => {
        onCard({ card, isValid });
    }, [card]);

    return render();
};

Method.propTypes = {
    method: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit']),
    amount: PropTypes.number.isRequired,
    onPay: PropTypes.func,
    onCard: PropTypes.func,
    onPayPal: PropTypes.func,
    currency: PropTypes.oneOf(['EUR', 'CHF', 'USD'])
};

Method.defaultProps = {
    amount: 0,
    loading: false
};

export default Method;
