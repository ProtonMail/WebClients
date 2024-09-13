import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import type { PaypalProcessorHook } from '@proton/components/payments/react-extensions/usePaypal';
import type { PaymentMethodFlows } from '@proton/payments';
import type { Currency } from '@proton/shared/lib/interfaces';

export type PayPalButtonProps = ButtonProps & {
    amount: number;
    flow?: PaymentMethodFlows;
    prefetchToken?: boolean;
    currency: Currency;
    paypal: PaypalProcessorHook;
};

export const PayPalButton = ({
    amount,
    flow,
    children,
    paypal,
    loading,
    disabled: disabledProp,
    currency,
    onClick,
    ...rest
}: PayPalButtonProps) => {
    const disabled = disabledProp || paypal.disabled;

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
        <Button loading={paypal.processingToken || loading} disabled={disabled} onClick={onClick} {...rest}>
            {children}
        </Button>
    );
};

export default PayPalButton;
