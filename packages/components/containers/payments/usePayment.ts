import { useEffect, useMemo, useState } from 'react';

import {
    PAYMENT_METHOD_TYPES,
    PaymentMethodType,
    isExistingPaymentMethod,
    methodMatches,
} from '@proton/components/payments/core';
import { Currency } from '@proton/shared/lib/interfaces';

import { ExistingPayment, WrappedCardPayment } from '../../payments/core/interface';
import toDetails from './toDetails';
import useCard from './useCard';
import usePayPal, { OnPayResult } from './usePayPal';

const { CARD, BITCOIN, CASH, PAYPAL, PAYPAL_CREDIT } = PAYMENT_METHOD_TYPES;

interface Props {
    amount: number;
    currency: Currency;
    onPaypalPay: (data: OnPayResult) => void;
    onValidatePaypal?: () => Promise<boolean>;
    defaultMethod?: PAYMENT_METHOD_TYPES | undefined;
}

const usePayment = ({ amount, currency, onValidatePaypal, onPaypalPay, defaultMethod }: Props) => {
    const { card, setCard, errors: cardErrors, isValid } = useCard();
    const [method, setMethod] = useState<PaymentMethodType | undefined>(defaultMethod);
    const [cardSubmitted, setCardSubmitted] = useState(false);
    const isPayPalActive = method === PAYPAL;

    const paypal = usePayPal({
        amount,
        currency,
        type: PAYPAL,
        onValidate: onValidatePaypal,
        onPay: onPaypalPay,
    });

    const paypalCredit = usePayPal({
        amount,
        currency,
        type: PAYPAL_CREDIT,
        onValidate: onValidatePaypal,
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

        if (!method || methodMatches(method, [BITCOIN, CASH, PAYPAL])) {
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
