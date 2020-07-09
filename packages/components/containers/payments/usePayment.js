import { useState, useEffect } from 'react';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { useCard, usePayPal } from 'react-components';

import toDetails from './toDetails';

const { CARD, BITCOIN, CASH, PAYPAL } = PAYMENT_METHOD_TYPES;

const usePayment = ({ amount, currency, onPay }) => {
    const [card, setCard, errors, isValid] = useCard();
    const [method, setMethod] = useState('');
    const [parameters, setParameters] = useState({});
    const isPayPalActive = method === PAYPAL;

    const paypal = usePayPal({
        amount,
        currency,
        type: PAYMENT_METHOD_TYPES.PAYPAL,
        onPay
    });

    const paypalCredit = usePayPal({
        amount,
        currency,
        type: PAYMENT_METHOD_TYPES.PAYPAL_CREDIT,
        onPay
    });

    const hasToken = () => {
        const { Payment = {} } = parameters;
        const { Details = {} } = Payment;
        const { Token } = Details;
        return !!Token;
    };

    const canPay = () => {
        if (!amount) {
            // Amount equals 0
            return true;
        }

        if (!method) {
            return false;
        }

        if ([BITCOIN, CASH].includes(method)) {
            return false;
        }

        if (method === CARD && !isValid) {
            return false;
        }

        if (method === PAYPAL && !hasToken()) {
            return false;
        }

        return true;
    };

    useEffect(() => {
        if (!method) {
            return;
        }

        if (![CARD, PAYPAL, CASH, BITCOIN].includes(method)) {
            setParameters({ PaymentMethodID: method });
        }

        if (method === CARD) {
            setParameters({ Payment: { Type: CARD, Details: toDetails(card) } });
        }

        // Reset parameters when switching methods
        if ([PAYPAL, CASH, BITCOIN].includes(method)) {
            setParameters({});
        }
    }, [method, card]);

    useEffect(() => {
        paypal.clear();
        paypalCredit.clear();
        if (isPayPalActive && amount) {
            paypal.onToken().then(() => paypalCredit.onToken());
        }
    }, [isPayPalActive, amount, currency]);

    return {
        paypal,
        paypalCredit,
        card,
        setCard,
        errors,
        method,
        setMethod,
        parameters,
        setParameters,
        canPay: canPay()
    };
};

export default usePayment;
