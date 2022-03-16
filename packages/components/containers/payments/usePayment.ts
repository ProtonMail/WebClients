import { useState, useEffect, useMemo } from 'react';
import { PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import usePayPal from './usePayPal';
import useCard from './useCard';
import toDetails from './toDetails';
import { PaymentParameters } from './interface';

const { CARD, BITCOIN, CASH, PAYPAL, PAYPAL_CREDIT } = PAYMENT_METHOD_TYPES;

interface Props {
    amount: number;
    currency: string;
    onPay: (data: PaymentParameters) => void;
}

const hasToken = (parameters: PaymentParameters): boolean => {
    const { Payment } = parameters;
    const { Details } = Payment || {};
    const { Token = '' } = (Details as any) || {};
    return !!Token;
};

const usePayment = ({ amount, currency, onPay }: Props) => {
    const { card, setCard, errors: cardErrors, isValid } = useCard();
    const [method, setMethod] = useState<PAYMENT_METHOD_TYPE | undefined>();
    const [cardSubmitted, setCardSubmitted] = useState(false);
    const isPayPalActive = method === PAYPAL;

    const paypal = usePayPal({
        amount,
        currency,
        type: PAYPAL,
        onPay,
    });

    const paypalCredit = usePayPal({
        amount,
        currency,
        type: PAYPAL_CREDIT,
        onPay,
    });

    const paymentParameters = useMemo((): PaymentParameters => {
        if (!method) {
            return {};
        }

        if (![CARD, PAYPAL, CASH, BITCOIN].includes(method as any)) {
            return { PaymentMethodID: method };
        }

        if (method === CARD) {
            return { Payment: { Type: CARD, Details: toDetails(card) } };
        }

        return {};
    }, [method, card]);

    const handleCardSubmit = () => {
        if (method === CARD) {
            setCardSubmitted(true);
        }
        if (method === CARD && !isValid) {
            return false;
        }
        return true;
    };

    const canPay = () => {
        if (!amount) {
            // Amount equals 0
            return true;
        }

        if (!method) {
            return false;
        }

        if ([BITCOIN, CASH].includes(method as any)) {
            return false;
        }

        if (method === PAYPAL && !hasToken(paymentParameters)) {
            return false;
        }

        return true;
    };

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
        handleCardSubmit,
        cardErrors: cardSubmitted ? cardErrors : {},
        method,
        setMethod,
        parameters: paymentParameters,
        canPay: canPay(),
    };
};

export default usePayment;
