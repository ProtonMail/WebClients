import { c } from 'ttag';

import { BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import {
    type Currency,
    type EnrichedCheckResponse,
    type FreeSubscription,
    PAYMENT_METHOD_TYPES,
    type Subscription,
    type SubscriptionCheckForbiddenReason,
    SubscriptionMode,
    SubscriptionPlatform,
    hasMigrationDiscount,
    isFreeSubscription,
    isTrial,
} from '@proton/payments';
import { PayButton, type TaxCountryHook } from '@proton/payments/ui';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import { getSubscriptionManagerName } from '../InAppPurchaseModal';
import { getVisionaryDowngradeWarningTextElement } from '../VisionaryDowngradeWarningModal';
import type { CouponConfigRendered } from '../coupon-config/useCouponConfig';
import { InfoBanner } from './InfoBanner';

export type Props = {
    className?: string;
    currency: Currency;
    onDone?: () => void;
    checkResult: EnrichedCheckResponse;
    loading?: boolean;
    disabled?: boolean;
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
    subscription: Subscription | FreeSubscription;
    taxCountry: TaxCountryHook;
    paymentFacade: PaymentFacade;
    couponConfig?: CouponConfigRendered;
    showVisionaryWarning: boolean;
    onSubmit: () => void;
    app: ProductParam;
};

export const SubscriptionSubmitButton = ({
    className,
    currency,
    loading,
    checkResult,
    disabled,
    onDone,
    paymentForbiddenReason,
    subscription,
    taxCountry,
    paymentFacade,
    couponConfig,
    showVisionaryWarning,
    app,
}: Props) => {
    if (paymentForbiddenReason.forbidden) {
        const info = (() => {
            let text = '';

            if (paymentForbiddenReason.reason === 'already-subscribed') {
                text = c('Payments').t`You already have a subscription to this plan.`;
            } else if (paymentForbiddenReason.reason === 'already-subscribed-externally') {
                if (isFreeSubscription(subscription) || subscription.External === SubscriptionPlatform.Default) {
                    return null;
                }

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
                children: couponConfig?.renderPayCTA?.() ?? c('Action').t`Pay ${price} now`,
            };
        }

        return {
            children: c('Action').t`Confirm`,
        };
    })();

    const discountLossWarning =
        hasMigrationDiscount(subscription) && couponConfig?.renderShowMigrationDiscountLossWarning?.() ? (
            <InfoBanner variant={BannerVariants.WARNING}>{c('Payments')
                .t`Your subscription currently has an existing discount. Moving to this new promotion means that the existing discount will no longer be applied.`}</InfoBanner>
        ) : null;

    const visionaryWarning = showVisionaryWarning ? (
        <InfoBanner variant={BannerVariants.WARNING}>
            {getVisionaryDowngradeWarningTextElement(subscription)}
        </InfoBanner>
    ) : null;

    const paymentWarnings = (
        <>
            {discountLossWarning}
            {visionaryWarning}
        </>
    );

    return (
        <>
            <PayButton
                color="norm"
                taxCountry={taxCountry}
                paymentFacade={paymentFacade}
                className={className}
                loading={loading}
                disabled={disabled}
                type="submit"
                data-testid="confirm"
                product={app}
                telemetryContext="subscription-modification"
                {...payButtonProps}
            />
            {paymentWarnings}
        </>
    );
};
