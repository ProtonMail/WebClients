import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';
import { PaypalProcessorHook, isPaypalProcessorHook } from '@proton/components/payments/react-extensions/usePaypal';
import { MAX_PAYPAL_AMOUNT, MIN_PAYPAL_AMOUNT } from '@proton/shared/lib/constants';
import { doNotWindowOpen } from '@proton/shared/lib/helpers/browser';
import { Currency } from '@proton/shared/lib/interfaces';

import { useNotifications } from '../../hooks';
import { PaymentMethodFlows } from '../paymentMethods/interface';
import { PayPalHook } from './usePayPal';

type CommonProps = ButtonProps & {
    amount: number;
    flow?: PaymentMethodFlows;
    prefetchToken?: boolean;
};

export type LegacyPayPalButtonProps = CommonProps & {
    paypal: PayPalHook;
};

function isLegacyPayPalButtonProps(props: PayPalButtonProps): props is LegacyPayPalButtonProps {
    return props && !isPaypalProcessorHook(props.paypal);
}

export type NewPayPalButtonProps = CommonProps & {
    currency: Currency;
    paypal: PaypalProcessorHook;
};

export type PayPalButtonProps = LegacyPayPalButtonProps | NewPayPalButtonProps;

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

export const LegacyPayPalButton = ({
    amount,
    flow,
    children,
    paypal,
    loading,
    disabled,
    prefetchToken = true,
    ...rest
}: LegacyPayPalButtonProps) => {
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

export const NewPayPalButton = ({
    amount,
    flow,
    children,
    paypal,
    loading,
    disabled,
    currency,
    ...rest
}: NewPayPalButtonProps) => {
    if (paypal.verifyingToken) {
        return <Button loading {...rest}>{c('Action').t`Loading verification`}</Button>;
    }

    if (paypal.verificationError) {
        return (
            <Button
                onClick={paypal.fetchPaymentToken}
                disabled={disabled}
                loading={paypal.processingToken}
                {...rest}
            >{c('Action').t`Retry`}</Button>
        );
    }

    return (
        <Button loading={paypal.processingToken || loading} disabled={disabled} {...rest}>
            {children}
        </Button>
    );
};

const PayPalButton = (props: PayPalButtonProps) => {
    if (isLegacyPayPalButtonProps(props)) {
        return <LegacyPayPalButton {...props} />;
    }

    return <NewPayPalButton {...props} />;
};

export default PayPalButton;
