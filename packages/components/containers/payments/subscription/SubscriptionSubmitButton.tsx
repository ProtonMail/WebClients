import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES, PaymentMethodType, methodMatches } from '@proton/components/payments/core';
import { Currency, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import { Price, PrimaryButton } from '../../../components';
import StyledPayPalButton from '../StyledPayPalButton';
import { PayPalHook } from '../usePayPal';
import { SUBSCRIPTION_STEPS } from './constants';

interface Props {
    className?: string;
    currency: Currency;
    step: SUBSCRIPTION_STEPS;
    onClose?: () => void;
    checkResult?: SubscriptionCheckResponse;
    loading?: boolean;
    method?: PaymentMethodType;
    paypal: PayPalHook;
    disabled?: boolean;
}

const SubscriptionSubmitButton = ({
    className,
    paypal,
    currency,
    step,
    loading,
    method,
    checkResult,
    disabled,
    onClose,
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

    if (method === PAYMENT_METHOD_TYPES.PAYPAL) {
        return <StyledPayPalButton flow="subscription" paypal={paypal} className={className} amount={amountDue} />;
    }

    if (!loading && methodMatches(method, [PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN])) {
        return (
            <PrimaryButton className={className} disabled={disabled} loading={loading} onClick={onClose}>
                {c('Action').t`Done`}
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
