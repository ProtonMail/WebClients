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
    prefetchToken?: boolean;
}

export function canUsePayPal({ amount, flow }: { amount: number; flow?: PaymentMethodFlows }): boolean {
    if (amount < MIN_PAYPAL_AMOUNT && flow !== 'invoice') {
        return false;
    }

    if (amount > MAX_PAYPAL_AMOUNT) {
        return false;
    }

    if (doNotWindowOpen()) {
        return false;
    }

    return true;
}

const PayPalButton = ({
    amount,
    flow,
    children,
    paypal,
    loading,
    disabled,
    prefetchToken = true,
    ...rest
}: PayPalButtonProps) => {
    const [retry, setRetry] = useState(false);
    const { createNotification } = useNotifications();

    if (!canUsePayPal({ amount, flow })) {
        return null;
    }

    if (retry) {
        const handleRetry = async () => {
            let model = await paypal.onToken();
            if (prefetchToken) {
                setRetry(false);
            } else {
                await paypal.onVerification(model);
            }
        };
        return (
            <Button onClick={handleRetry} disabled={disabled} loading={loading} {...rest}>{c('Action')
                .t`Retry`}</Button>
        );
    }

    if (paypal.loadingVerification) {
        return <Button loading {...rest}>{c('Action').t`Loading verification`}</Button>;
    }

    const handleClick = async () => {
        try {
            let model: Awaited<ReturnType<PayPalHook['onToken']>> | undefined;
            if (!prefetchToken) {
                model = await paypal.onToken();
            }
            await paypal.onVerification(model);
        } catch (error: any) {
            // if not coming from API error
            if (error && error.message && !error.config) {
                createNotification({ text: error.message, type: 'error' });
            }
            setRetry(true);
        }
    };

    return (
        <Button
            disabled={(!paypal.isReady && prefetchToken) || disabled}
            onClick={handleClick}
            loading={paypal.loadingToken || loading}
            {...rest}
        >
            {children}
        </Button>
    );
};

export default PayPalButton;
