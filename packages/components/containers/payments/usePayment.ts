import { useState, useEffect } from 'react';
import { PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

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

const usePayment = ({ amount, currency, onPay }: Props) => {
    const { card, setCard, errors, isValid } = useCard();
    const [method, setMethod] = useState<PAYMENT_METHOD_TYPE | undefined>();
    const [parameters, setParameters] = useState<PaymentParameters>({});
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

    const hasToken = (): boolean => {
        const { Payment } = parameters;
        const { Details } = Payment || {};
        const { Token = '' } = (Details as any) || {};
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

        if ([BITCOIN, CASH].includes(method as any)) {
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

        if (![CARD, PAYPAL, CASH, BITCOIN].includes(method as any)) {
            setParameters({ PaymentMethodID: method });
        }

        if (method === CARD) {
            setParameters({ Payment: { Type: CARD, Details: toDetails(card) } });
        }

        // Reset parameters when switching methods
        if ([PAYPAL, CASH, BITCOIN].includes(method as any)) {
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
        canPay: canPay(),
    };
};

export default usePayment;
