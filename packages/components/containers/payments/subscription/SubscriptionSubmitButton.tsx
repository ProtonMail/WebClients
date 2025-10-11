import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import useConfig from '@proton/components/hooks/useConfig';
import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import {
    type Currency,
    PAYMENT_METHOD_TYPES,
    type Subscription,
    type SubscriptionCheckForbiddenReason,
    type SubscriptionCheckResponse,
    SubscriptionMode,
    isTrial,
} from '@proton/payments';
import { EditCardModal, PayButton, type TaxCountryHook } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';

import { getSubscriptionManagerName } from './InAppPurchaseModal';
import type { SUBSCRIPTION_STEPS } from './constants';

type Props = {
    className?: string;
    currency: Currency;
    step: SUBSCRIPTION_STEPS;
    onDone?: () => void;
    checkResult?: SubscriptionCheckResponse;
    loading?: boolean;
    disabled?: boolean;
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
    subscription: Subscription;
    hasPaymentMethod: boolean;
    taxCountry: TaxCountryHook;
    paymentFacade: PaymentFacade;
};

const InfoBanner = ({ children }: PropsWithChildren) => {
    return (
        <Banner className="mt-2 mb-4" variant={BannerVariants.INFO}>
            {children}
        </Banner>
    );
};

const SubscriptionSubmitButton = ({
    className,
    currency,
    loading,
    checkResult,
    disabled,
    onDone,
    paymentForbiddenReason,
    hasPaymentMethod,
    subscription,
    taxCountry,
    paymentFacade,
}: Props) => {
    const [creditCardModalProps, setCreditCardModalOpen, renderCreditCardModal] = useModalState();
    const { APP_NAME } = useConfig();

    if (paymentForbiddenReason.forbidden) {
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
                    <InfoBanner>{c('Payments')
                        .t`Payment method required for the subscription to be activated after the trial ends.`}</InfoBanner>
                    {renderCreditCardModal && (
                        <EditCardModal enableRenewToggle={false} onMethodAdded={onDone} {...creditCardModalProps} />
                    )}
                </>
            );
        }

        const info = (() => {
            let text = '';

            if (paymentForbiddenReason.reason === 'already-subscribed') {
                text = c('Payments').t`You already have a subscription to this plan.`;
            } else if (paymentForbiddenReason.reason === 'already-subscribed-externally') {
                const subscriptionPlatform = getSubscriptionManagerName(subscription.External);
                // translator: subscription platform is either "Apple App Store" or "Google Play".
                text = c('Payments')
                    .t`You already have a subscription to this plan. You can change your subscription on ${subscriptionPlatform}.`;
            } else if (paymentForbiddenReason.reason === 'offer-not-available') {
                text = c('Payments').t`This offer is not available with your current plan.`;
            }

            if (!text) {
                return null;
            }

            return <InfoBanner>{text}</InfoBanner>;
        })();

        // If the user is on the ProtonAccountLite app, the user should not be able to close the modal
        if (APP_NAME === APPS.PROTONACCOUNTLITE) {
            return (
                <>
                    <Button color="norm" className={className} disabled={true} loading={loading}>{c('Action')
                        .t`Done`}</Button>
                    {info}
                </>
            );
        }

        return (
            <>
                <Button color="norm" className={className} disabled={disabled} loading={loading} onClick={onDone}>
                    {c('Action').t`Close`}
                </Button>
                {info}
            </>
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
            if (isTrial(subscription) && checkResult?.SubscriptionMode === SubscriptionMode.Regular) {
                return {
                    children: c('Action').t`Cancel trial and pay`,
                };
            }

            const price = getSimplePriceString(currency, amountDue);
            return {
                children: c('Action').t`Pay ${price} now`,
            };
        }

        if (isTrial(subscription)) {
            return {
                children: c('Action').t`Save`,
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
