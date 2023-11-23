import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES, PaymentMethodType } from '@proton/components/payments/core';
import { PaypalProcessorHook } from '@proton/components/payments/react-extensions/usePaypal';
import { Currency, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import { Price, PrimaryButton } from '../../../components';
import StyledPayPalButton from '../StyledPayPalButton';
import { SUBSCRIPTION_STEPS } from './constants';

interface Props {
    className?: string;
    currency: Currency;
    step: SUBSCRIPTION_STEPS;
    onDone?: () => void;
    checkResult?: SubscriptionCheckResponse;
    loading?: boolean;
    paymentMethodValue?: PaymentMethodType;
    paypal: PaypalProcessorHook;
    disabled?: boolean;
}

const SubscriptionSubmitButton = ({
    className,
    paypal,
    currency,
    step,
    loading,
    paymentMethodValue,
    checkResult,
    disabled,
    onDone,
}: Props) => {
    const amountDue = checkResult?.AmountDue || 0;

    if (step === SUBSCRIPTION_STEPS.CUSTOMIZATION) {
        return (
            <PrimaryButton
                className={className}
                disabled={disabled}
                loading={loading}
                type="submit"
                data-testid="confirm"
            >
                {c('Action').t`Continue`}
            </PrimaryButton>
        );
    }

    if (amountDue === 0) {
        return (
            <PrimaryButton
                className={className}
                loading={loading}
                disabled={disabled}
                type="submit"
                data-testid="confirm"
            >
                {c('Action').t`Confirm`}
            </PrimaryButton>
        );
    }

    if (paymentMethodValue === PAYMENT_METHOD_TYPES.PAYPAL) {
        return (
            <StyledPayPalButton
                type="submit"
                data-testid="confirm"
                paypal={paypal}
                className={className}
                amount={amountDue}
                currency={currency}
            />
        );
    }

    if (!loading && paymentMethodValue === PAYMENT_METHOD_TYPES.CASH) {
        return (
            <PrimaryButton className={className} disabled={disabled} loading={loading} onClick={onDone}>
                {c('Action').t`Done`}
            </PrimaryButton>
        );
    }

    if (paymentMethodValue === PAYMENT_METHOD_TYPES.BITCOIN) {
        return (
            <PrimaryButton className={className} disabled={true} loading={loading}>
                {c('Info').t`Awaiting transaction`}
            </PrimaryButton>
        );
    }

    const price = (
        <Price key="price" currency={currency}>
            {amountDue}
        </Price>
    );

    return (
        <PrimaryButton className={className} loading={loading} disabled={disabled} type="submit" data-testid="confirm">
            {amountDue > 0 ? c('Action').jt`Pay ${price} now` : c('Action').t`Confirm`}
        </PrimaryButton>
    );
};

export default SubscriptionSubmitButton;
