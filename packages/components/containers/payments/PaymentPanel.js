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

const PaymentPanel = ({ type, amount, currency, onCard, onPayPal, method }) => {
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
        onCard({ card, errors, isValid });
    }, [card]);

    return render();
};

PaymentPanel.propTypes = {
    method: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation']),
    amount: PropTypes.number.isRequired,
    methods: PropTypes.arrayOf(PropTypes.string),
    onPay: PropTypes.func,
    onCard: PropTypes.func,
    onPayPay: PropTypes.func,
    currency: PropTypes.oneOf(['EUR', 'CHF', 'USD'])
};

PaymentPanel.defaultProps = {
    amount: 0,
    loading: false
};

export default PaymentPanel;
