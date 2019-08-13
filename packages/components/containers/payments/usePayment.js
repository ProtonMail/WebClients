import { useState } from 'react';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

const { CARD, BITCOIN, CASH, PAYPAL } = PAYMENT_METHOD_TYPES;

const usePayment = () => {
    const [method, setMethod] = useState('');
    const [parameters, setParameters] = useState({});
    const [isCardValid, setCardValidity] = useState(false);

    const hasToken = () => {
        const { Payment = {} } = parameters;
        const { Details = {} } = Payment;
        const { Token } = Details;
        return !!Token;
    };

    const canPay = () => {
        if ([BITCOIN, CASH].includes(method)) {
            return false;
        }

        if (method === CARD && !isCardValid) {
            return false;
        }

        if (method === PAYPAL && !hasToken()) {
            return false;
        }

        return true;
    };

    return {
        method,
        setMethod,
        parameters,
        setParameters,
        canPay: canPay(),
        setCardValidity
    };
};

export default usePayment;
