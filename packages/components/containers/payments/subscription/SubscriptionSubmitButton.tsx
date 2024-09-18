import { c } from 'ttag';

import { PrimaryButton, useConfig, useModalState } from '@proton/components';
import Price from '@proton/components/components/price/Price';
import { isChargebeePaymentProcessor } from '@proton/components/payments/react-extensions/helpers';
import type { PaymentProcessorType } from '@proton/components/payments/react-extensions/interface';
import type { PaypalProcessorHook } from '@proton/components/payments/react-extensions/usePaypal';
import type { PaymentMethodType, PlainPaymentMethodType } from '@proton/payments';
import { PAYMENT_METHOD_TYPES, isChargebeePaymentMethod } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import type { Currency, SubscriptionCheckResponse, SubscriptionModel } from '@proton/shared/lib/interfaces';

import type { ChargebeePaypalWrapperProps } from '../../../payments/chargebee/ChargebeeWrapper';
import { ChargebeePaypalWrapper } from '../../../payments/chargebee/ChargebeeWrapper';
import EditCardModal from '../EditCardModal';
import StyledPayPalButton from '../StyledPayPalButton';
import type { SUBSCRIPTION_STEPS } from './constants';
import type { BillingAddressStatus } from './helpers';

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
    subscription: SubscriptionModel;
    hasPaymentMethod: boolean;
    billingAddressStatus: BillingAddressStatus;
    paymentProcessorType: PaymentProcessorType | undefined;
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
}: Props) => {
    const [creditCardModalProps, setCreditCardModalOpen, renderCreditCardModal] = useModalState();
    const { APP_NAME } = useConfig();

    if (noPaymentNeeded) {
        if (isTrial(subscription) && !hasPaymentMethod) {
            return (
                <>
                    <PrimaryButton
                        className={className}
                        disabled={disabled}
                        loading={loading}
                        onClick={() => setCreditCardModalOpen(true)}
                    >
                        {c('Action').t`Add credit / debit card`}
                    </PrimaryButton>
                    {renderCreditCardModal && (
                        <EditCardModal enableRenewToggle={false} onMethodAdded={onDone} {...creditCardModalProps} />
                    )}
                </>
            );
        }

        // If the user is on the ProtonAccountLite app, the user should not be able to close the modal
        if (APP_NAME === APPS.PROTONACCOUNTLITE) {
            return (
                <PrimaryButton className={className} disabled={true} loading={loading}>{c('Action')
                    .t`Done`}</PrimaryButton>
            );
        }

        return (
            <PrimaryButton className={className} disabled={disabled} loading={loading} onClick={onDone}>
                {c('Action').t`Close`}
            </PrimaryButton>
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
            <PrimaryButton
                className={className}
                loading={loading}
                disabled={disabled || chargebeeInvalidBillingAddress}
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

    const billingAddressPlaceholder = (
        <PrimaryButton className={className} disabled={true}>{c('Payments')
            .t`Select billing country to pay`}</PrimaryButton>
    );

    if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        if (chargebeeInvalidBillingAddress) {
            return billingAddressPlaceholder;
        }

        return <ChargebeePaypalWrapper chargebeePaypal={chargebeePaypal} iframeHandles={iframeHandles} />;
    }

    if (!loading && paymentMethodValue === PAYMENT_METHOD_TYPES.CASH) {
        return (
            <PrimaryButton className={className} disabled={disabled} loading={loading} onClick={onDone}>
                {c('Action').t`Done`}
            </PrimaryButton>
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
            <PrimaryButton className={className} disabled={true} loading={loading}>
                {c('Info').t`Awaiting transaction`}
            </PrimaryButton>
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
            <PrimaryButton
                className={className}
                loading={loading}
                disabled={disabled}
                type="submit"
                data-testid="confirm"
            >
                {amountDue > 0 ? c('Action').jt`Pay ${price} now` : c('Action').t`Confirm`}
            </PrimaryButton>
        </>
    );
};

export default SubscriptionSubmitButton;
