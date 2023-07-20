import { useEffect, useMemo, useState } from 'react';

import {
    PAYMENT_METHOD_TYPES,
    PaymentMethodType,
    isExistingPaymentMethod,
    methodMatches,
} from '@proton/components/payments/core';
import { Api, Currency } from '@proton/shared/lib/interfaces';

import { ExistingPayment, WrappedCardPayment } from '../../payments/core/interface';
import toDetails from './toDetails';
import useCard from './useCard';
import usePayPal, { OnPayResult } from './usePayPal';

const { CARD, BITCOIN, CASH, PAYPAL, PAYPAL_CREDIT } = PAYMENT_METHOD_TYPES;

interface Props {
    api: Api;
    amount: number;
    currency: Currency;
    onPaypalPay: (data: OnPayResult) => void;
    onPaypalError?: (error: any, type: 'pay_pp' | 'pay_pp_no_cc') => void;
    onValidatePaypal?: (type: 'pay_pp' | 'pay_pp_no_cc') => boolean;
    defaultMethod?: PAYMENT_METHOD_TYPES | undefined;
    paypalPrefetchToken?: boolean;
    onBeforeTokenFetchPaypal?: () => Promise<unknown> | unknown;
    ignoreName?: boolean;
}

const usePayment = ({
    api,
    amount,
    currency,
    onValidatePaypal,
    onPaypalPay,
    onPaypalError,
    defaultMethod,
    paypalPrefetchToken = true,
    onBeforeTokenFetchPaypal,
    ignoreName = false,
}: Props) => {
    const { card, setCard, errors: cardErrors, fieldsStatus: cardFieldStatus, isValid } = useCard({ ignoreName });
    const [method, setMethod] = useState<PaymentMethodType | undefined>(defaultMethod);
    const [cardSubmitted, setCardSubmitted] = useState(false);
    const isPayPalActive = method === PAYPAL;

    const paypal = usePayPal({
        api,
        amount,
        currency,
        type: PAYPAL,
        onValidate: onValidatePaypal ? () => onValidatePaypal('pay_pp') : undefined,
        onError: onPaypalError ? (error) => onPaypalError(error, 'pay_pp') : undefined,
        onPay: onPaypalPay,
        onBeforeTokenFetch: onBeforeTokenFetchPaypal,
    });

    const paypalCredit = usePayPal({
        api,
        amount,
        currency,
        type: PAYPAL_CREDIT,
        onValidate: onValidatePaypal ? () => onValidatePaypal('pay_pp_no_cc') : undefined,
        onError: onPaypalError ? (error) => onPaypalError(error, 'pay_pp_no_cc') : undefined,
        onPay: onPaypalPay,
        onBeforeTokenFetch: onBeforeTokenFetchPaypal,
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
        if (isPayPalActive && amount && paypalPrefetchToken) {
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
        cardFieldStatus,
        method,
        setMethod,
        parameters: paymentParameters,
        canPay: canPay(),
    };
};

export default usePayment;
