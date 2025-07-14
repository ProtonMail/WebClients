import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import useConfig from '@proton/components/hooks/useConfig';
import { type PaymentFacade } from '@proton/components/payments/client-extensions';
import { type Currency, PAYMENT_METHOD_TYPES, type Subscription, isTrial } from '@proton/payments';
import { EditCardModal } from '@proton/payments/ui';
import { PayButton, type TaxCountryHook } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';
import type { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import type { SUBSCRIPTION_STEPS } from './constants';

type Props = {
    className?: string;
    currency: Currency;
    step: SUBSCRIPTION_STEPS;
    onDone?: () => void;
    checkResult?: SubscriptionCheckResponse;
    loading?: boolean;
    disabled?: boolean;
    paymentForbidden?: boolean;
    subscription: Subscription;
    hasPaymentMethod: boolean;
    taxCountry: TaxCountryHook;
    paymentFacade: PaymentFacade;
};

const SubscriptionSubmitButton = ({
    className,
    currency,
    loading,
    checkResult,
    disabled,
    onDone,
    paymentForbidden,
    hasPaymentMethod,
    subscription,
    taxCountry,
    paymentFacade,
}: Props) => {
    const [creditCardModalProps, setCreditCardModalOpen, renderCreditCardModal] = useModalState();
    const { APP_NAME } = useConfig();

    if (paymentForbidden) {
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

    const isBitcoin = paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN;
    const isCash = paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.CASH;

    const payButtonProps = (() => {
        if (isBitcoin) {
            return {
                disabled: true,
                children: c('Info').t`Awaiting transaction`,
            };
        }

        if (isCash) {
            return {
                onClick: onDone,
                children: c('Action').t`Done`,
            };
        }

        const amountDue = checkResult?.AmountDue || 0;
        if (amountDue > 0) {
            const price = getSimplePriceString(currency, amountDue);
            return {
                children: c('Action').t`Pay ${price} now`,
            };
        }

        return {
            children: c('Action').t`Confirm`,
        };
    })();

    return (
        <PayButton
            color="norm"
            taxCountry={taxCountry}
            paymentFacade={paymentFacade}
            className={className}
            loading={loading}
            disabled={disabled}
            type="submit"
            data-testid="confirm"
            {...payButtonProps}
        />
    );
};

export default SubscriptionSubmitButton;
