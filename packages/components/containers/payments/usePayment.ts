import { useEffect, useMemo, useState } from 'react';

import { PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import { ExistingPayment, WrappedCardPayment } from './interface';
import toDetails from './toDetails';
import useCard from './useCard';
import usePayPal, { OnPayResult } from './usePayPal';

const { CARD, BITCOIN, CASH, PAYPAL, PAYPAL_CREDIT } = PAYMENT_METHOD_TYPES;

function isExistingPaymentMethod(paymentMethod: string) {
    const newPaymentMethods: string[] = Object.values(PAYMENT_METHOD_TYPES);
    return !newPaymentMethods.includes(paymentMethod);
}

interface Props {
    amount: number;
    currency: Currency;
    onPaypalPay: (data: OnPayResult) => void;
    defaultMethod?: PAYMENT_METHOD_TYPES | undefined;
}

const usePayment = ({ amount, currency, onPaypalPay, defaultMethod }: Props) => {
    const { card, setCard, errors: cardErrors, isValid } = useCard();
    const [method, setMethod] = useState<PAYMENT_METHOD_TYPE | undefined>(defaultMethod);
    const [cardSubmitted, setCardSubmitted] = useState(false);
    const isPayPalActive = method === PAYPAL;

    const paypal = usePayPal({
        amount,
        currency,
        type: PAYPAL,
        onPay: onPaypalPay,
    });

    const paypalCredit = usePayPal({
        amount,
        currency,
        type: PAYPAL_CREDIT,
        onPay: onPaypalPay,
    });

    const paymentParameters = useMemo((): ExistingPayment | WrappedCardPayment | null => {
        if (!method) {
            return null;
        }

        if (isExistingPaymentMethod(method)) {
            const existingMethod: ExistingPayment = { PaymentMethodID: method };
            return existingMethod;
        }

        if (method === CARD) {
            const wrappedCardPayment: WrappedCardPayment = { Payment: { Type: CARD, Details: toDetails(card) } };
            return wrappedCardPayment;
        }

        return null;
    }, [method, card]);

    const handleCardSubmit = () => {
        if (!amount) {
            return true;
        }
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

        const methodsWithDifferentProcessing: string[] = [BITCOIN, CASH, PAYPAL];
        if (methodsWithDifferentProcessing.includes(method)) {
            return false;
        }

        // Essentially, credit card or existing method. Existing methods could be previously saved credit card or
        // previously saved paypal
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
