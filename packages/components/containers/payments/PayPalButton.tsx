import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';
import { MAX_PAYPAL_AMOUNT, MIN_PAYPAL_AMOUNT } from '@proton/shared/lib/constants';
import { doNotWindowOpen } from '@proton/shared/lib/helpers/browser';

import { useNotifications } from '../../hooks';
import { PaymentMethodFlows } from '../paymentMethods/interface';
import { PayPalHook } from './usePayPal';

export interface PayPalButtonProps extends ButtonProps {
    amount: number;
    paypal: PayPalHook;
    flow?: PaymentMethodFlows;
}

const PayPalButton = ({ amount, flow, children, paypal, loading, ...rest }: PayPalButtonProps) => {
    const [retry, setRetry] = useState(false);
    const { createNotification } = useNotifications();

    if (amount < MIN_PAYPAL_AMOUNT && flow !== 'invoice') {
        return null;
    }

    if (amount > MAX_PAYPAL_AMOUNT) {
        return null;
    }

    if (doNotWindowOpen()) {
        return null;
    }

    if (retry) {
        const handleRetry = () => {
            paypal.onToken();
            setRetry(false);
        };
        return <Button onClick={handleRetry} loading={loading} {...rest}>{c('Action').t`Retry`}</Button>;
    }

    if (paypal.loadingVerification) {
        return <Button loading {...rest}>{c('Action').t`Loading verification`}</Button>;
    }

    const handleClick = async () => {
        try {
            await paypal.onVerification();
        } catch (error: any) {
            // if not coming from API error
            if (error && error.message && !error.config) {
                createNotification({ text: error.message, type: 'error' });
            }
            setRetry(true);
        }
    };

    return (
        <Button disabled={!paypal.isReady} onClick={handleClick} loading={paypal.loadingToken || loading} {...rest}>
            {children}
        </Button>
    );
};

export default PayPalButton;
