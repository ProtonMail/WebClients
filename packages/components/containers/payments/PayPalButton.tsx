import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import type { PaypalProcessorHook } from '@proton/components/payments/react-extensions/usePaypal';
import type { PaymentMethodFlow } from '@proton/payments';

export type PayPalButtonProps = ButtonProps & {
    flow?: PaymentMethodFlow;
    prefetchToken?: boolean;
    paypal: PaypalProcessorHook;
};

export const PayPalButton = ({
    flow,
    children,
    paypal,
    loading,
    disabled: disabledProp,
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
