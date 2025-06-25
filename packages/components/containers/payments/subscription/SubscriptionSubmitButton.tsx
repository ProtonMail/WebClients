import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import useConfig from '@proton/components/hooks/useConfig';
import { isChargebeePaymentProcessor } from '@proton/components/payments/react-extensions/helpers';
import type { PaypalProcessorHook } from '@proton/components/payments/react-extensions/usePaypal';
import type { ApplePayProcessorHook, PaymentProcessorType } from '@proton/payments';
import type { PaymentMethodType, PlainPaymentMethodType } from '@proton/payments';
import {
    type BillingAddressStatus,
    type Currency,
    PAYMENT_METHOD_TYPES,
    type Subscription,
    isChargebeePaymentMethod,
    isTrial,
} from '@proton/payments';
import { EditCardModal } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';
import type { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import type { ChargebeePaypalWrapperProps } from '../../../payments/chargebee/ChargebeeWrapper';
import { ApplePayButton, ChargebeePaypalWrapper } from '../../../payments/chargebee/ChargebeeWrapper';
import StyledPayPalButton from '../StyledPayPalButton';
import type { SUBSCRIPTION_STEPS } from './constants';

type Props = {
    className?: string;
    currency: Currency;
    step: SUBSCRIPTION_STEPS;
    onDone?: () => void;
    checkResult?: SubscriptionCheckResponse;
    loading?: boolean;
    paymentMethodValue?: PaymentMethodType;
    paymentMethodType: PlainPaymentMethodType | undefined;
    paypal: PaypalProcessorHook;
    disabled?: boolean;
    noPaymentNeeded?: boolean;
    subscription: Subscription;
    hasPaymentMethod: boolean;
    billingAddressStatus: BillingAddressStatus;
    paymentProcessorType: PaymentProcessorType | undefined;
    applePay: ApplePayProcessorHook;
} & Pick<ChargebeePaypalWrapperProps, 'chargebeePaypal' | 'iframeHandles'>;

const SubscriptionSubmitButton = ({
    className,
    paypal,
    currency,
    loading,
    paymentMethodValue,
    paymentMethodType,
    checkResult,
    disabled,
    onDone,
    chargebeePaypal,
    iframeHandles,
    noPaymentNeeded,
    hasPaymentMethod,
    subscription,
    billingAddressStatus,
    paymentProcessorType,
    applePay,
}: Props) => {
    const [creditCardModalProps, setCreditCardModalOpen, renderCreditCardModal] = useModalState();
    const { APP_NAME } = useConfig();

    if (noPaymentNeeded) {
        if (isTrial(subscription) && !hasPaymentMethod) {
            return (
                <>
                    <Button
                        color="norm"
                        className={className}
                        disabled={disabled}
                        loading={loading}
                        onClick={() => setCreditCardModalOpen(true)}
                    >
                        {c('Action').t`Add credit / debit card`}
                    </Button>
                    {renderCreditCardModal && (
                        <EditCardModal enableRenewToggle={false} onMethodAdded={onDone} {...creditCardModalProps} />
                    )}
                </>
            );
        }

        // If the user is on the ProtonAccountLite app, the user should not be able to close the modal
        if (APP_NAME === APPS.PROTONACCOUNTLITE) {
            return (
                <Button color="norm" className={className} disabled={true} loading={loading}>{c('Action')
                    .t`Done`}</Button>
            );
        }

        return (
            <Button color="norm" className={className} disabled={disabled} loading={loading} onClick={onDone}>
                {c('Action').t`Close`}
            </Button>
        );
    }

    const chargebeeInvalidBillingAddress =
        !billingAddressStatus.valid &&
        // the isChargebeePaymentProcessor condition checks if user has inhouse saved payment method used in the
        // chargebee saved payment processor
        (isChargebeePaymentMethod(paymentMethodType) || isChargebeePaymentProcessor(paymentProcessorType));

    const amountDue = checkResult?.AmountDue || 0;
    if (amountDue === 0) {
        return (
            <Button
                color="norm"
                className={className}
                loading={loading}
                disabled={disabled || chargebeeInvalidBillingAddress}
                type="submit"
                data-testid="confirm"
            >
                {c('Action').t`Confirm`}
            </Button>
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

    const billingAddressPlaceholder = (
        <Button color="norm" className={className} disabled={true}>{c('Payments')
            .t`Select billing country to pay`}</Button>
    );

    if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        if (chargebeeInvalidBillingAddress) {
            return billingAddressPlaceholder;
        }

        return <ChargebeePaypalWrapper chargebeePaypal={chargebeePaypal} iframeHandles={iframeHandles} />;
    }

    if (paymentMethodValue === PAYMENT_METHOD_TYPES.APPLE_PAY) {
        return <ApplePayButton applePay={applePay} iframeHandles={iframeHandles} />;
    }

    if (!loading && paymentMethodValue === PAYMENT_METHOD_TYPES.CASH) {
        return (
            <Button color="norm" className={className} disabled={disabled} loading={loading} onClick={onDone}>
                {c('Action').t`Done`}
            </Button>
        );
    }

    if (
        paymentMethodValue === PAYMENT_METHOD_TYPES.BITCOIN ||
        paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN
    ) {
        if (chargebeeInvalidBillingAddress) {
            return billingAddressPlaceholder;
        }

        return (
            <Button color="norm" className={className} disabled={true} loading={loading}>
                {c('Info').t`Awaiting transaction`}
            </Button>
        );
    }

    if (chargebeeInvalidBillingAddress) {
        return billingAddressPlaceholder;
    }

    const price = (
        <Price key="price" currency={currency}>
            {amountDue}
        </Price>
    );

    return (
        <>
            <Button
                color="norm"
                className={className}
                loading={loading}
                disabled={disabled}
                type="submit"
                data-testid="confirm"
            >
                {amountDue > 0 ? c('Action').jt`Pay ${price} now` : c('Action').t`Confirm`}
            </Button>
        </>
    );
};

export default SubscriptionSubmitButton;
