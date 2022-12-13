import { c } from 'ttag';

import { PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
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
    method?: PAYMENT_METHOD_TYPE;
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
            <PrimaryButton className={className} disabled={disabled} loading={loading} type="submit">
                {c('Action').t`Continue`}
            </PrimaryButton>
        );
    }

    if (amountDue === 0) {
        return (
            <PrimaryButton className={className} loading={loading} disabled={disabled} type="submit">
                {c('Action').t`Confirm`}
            </PrimaryButton>
        );
    }

    if (method === PAYMENT_METHOD_TYPES.PAYPAL) {
        return <StyledPayPalButton flow="subscription" paypal={paypal} className={className} amount={amountDue} />;
    }

    if (!loading && method && [PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method as any)) {
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
        <PrimaryButton className={className} loading={loading} disabled={disabled} type="submit">
            {amountDue > 0 ? c('Action').jt`Pay ${price} now` : c('Action').t`Confirm`}
        </PrimaryButton>
    );
};

export default SubscriptionSubmitButton;
