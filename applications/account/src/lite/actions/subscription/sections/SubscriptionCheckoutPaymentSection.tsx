import { type FormEvent, useEffect } from 'react';

import { c } from 'ttag';

import { useAppName } from '@proton/account/appName';
import { useUser } from '@proton/account/user/hooks';
import { SubscriptionConfirmButton } from '@proton/components/containers/payments/subscription/confirm-button/SubscriptionConfirmButton';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getPaymentMethodRequired } from '@proton/components/containers/payments/subscription/helpers/getPaymentMethodRequired';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { usePaymentFacade } from '@proton/components/payments/client-extensions';
import useLoading from '@proton/hooks/useLoading';
import { IcLock } from '@proton/icons/icons/IcLock';
import type { PaymentMethodType, PaymentProcessorHook } from '@proton/payments';
import {
    DisplayablePaymentError,
    SubscriptionMode,
    getPaymentsVersion,
    hasPlanIDs,
    isSubscriptionCheckForbiddenWithReason,
} from '@proton/payments';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { useTaxCountry, useVatNumber } from '@proton/payments/ui';
import { getCheckoutRenewNoticeTextFromCheckResult } from '@proton/payments/ui/components/RenewalNotice';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Audience } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { getCodesForSubscription } from '../helpers';
import PaymentMethodForm from './payment-section/PaymentMethodForm';
import PaymentMethodSelector from './payment-section/PaymentMethodSelector';

interface Props {
    paymentFacade: ReturnType<typeof usePaymentFacade>;
    subscribing: boolean;
    onClose: () => void;
    renderVisionaryDowngradeWarningText: boolean;
}

const SubscriptionCheckoutPaymentSection = ({
    paymentFacade,
    subscribing,
    onClose,
    renderVisionaryDowngradeWarningText,
}: Props) => {
    const { APP_NAME } = useConfig();
    const appName = useAppName();
    const [loading, withLoading] = useLoading();
    const [user] = useUser();
    const {
        subscription,
        checkoutUi,
        zipCodeValid,
        paymentStatus,
        billingAddress,
        selectBillingAddress,
        plansMap,
        checkResult,
        telemetryContext,
        loading: paymentsLoading,
        setVatNumber,
        coupon,
        selectCurrency,
        couponConfig,
    } = usePayments();
    const { planIDs, cycle, planName, currency } = checkoutUi;
    const { amount, selectedMethodValue, methods, currencyOverride } = paymentFacade;
    const { selectMethod, savedMethods } = methods;
    const taxCountry = useTaxCountry({
        onBillingAddressChange: selectBillingAddress,
        zipCodeBackendValid: zipCodeValid,
        paymentStatus,
        paymentFacade,
        previousValidZipCode: billingAddress.ZipCode,
        telemetryContext,
    });
    const vatNumber = useVatNumber({
        selectedPlanName: planName,
        taxCountry,
        onVatUpdated: (vatNumber) => setVatNumber(vatNumber ?? ''),
    });
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (paymentsLoading) {
            return;
        }
        const selectedMethod = methods.allMethods.find((otherMethod) => otherMethod.value === selectedMethodValue);
        const firstMethod = methods.allMethods[0];
        if (!selectedMethod && firstMethod) {
            methods.selectMethod(firstMethod.value);
        }
    }, [paymentsLoading, methods.allMethods.length]);

    if (!subscription) {
        return null;
    }

    const isTrial = checkResult?.SubscriptionMode === SubscriptionMode.Trial;
    const paymentMethodRequired = getPaymentMethodRequired({
        amount,
        startTrial: isTrial,
        subscription,
        savedPaymentMethods: savedMethods,
    });
    const isPaidPlanSelected = hasPlanIDs(planIDs);
    const isFreePlanSelected = !isPaidPlanSelected;
    const isFreeUserWithFreePlanSelected = user.isFree && isFreePlanSelected;
    const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(subscription, planIDs, cycle);
    const hasPaymentMethod = !!methods.savedMethods?.length;
    const displayRenewNotice = isPaidPlanSelected && !paymentForbiddenReason.forbidden;

    const handleSubmit = async (processor?: PaymentProcessorHook) => {
        if (!processor) {
            return;
        }

        try {
            paymentFacade.paymentContext.setSubscriptionData({
                Plans: planIDs,
                Codes: getCodesForSubscription(checkResult.Gift ? coupon : '', checkResult.Coupon?.Code),
                Cycle: cycle,
                product: appName,
                taxBillingAddress: billingAddress,
                StartTrial: isTrial,
                vatNumber: vatNumber.vatNumber,
            });
            await processor.processPaymentToken();
        } catch (e) {
            let tokenDidntHaveEmail = false;
            if (e instanceof DisplayablePaymentError) {
                createNotification({ text: e.message, type: 'error' });
                tokenDidntHaveEmail = true;
            }

            const error = getSentryError(e);
            if (error) {
                const context = {
                    app: appName,
                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                    cycle: cycle,
                    currency: currency,
                    amount,
                    coupon: checkResult.Coupon?.Code,
                    planIDs,
                    audience: Audience.B2B,
                    processorType: paymentFacade.selectedProcessor?.meta.type,
                    paymentMethod: paymentFacade.selectedMethodType,
                    paymentMethodValue: paymentFacade.selectedMethodValue,
                    paymentsVersion: getPaymentsVersion(),
                    tokenDidntHaveEmail,
                };
                captureMessage('Payments: failed to handle subscription (Account Lite)', {
                    level: 'error',
                    extra: { error, context },
                });
            }
        }
    };

    const onSubmit = (e?: FormEvent) => {
        e?.preventDefault();

        if (paymentForbiddenReason.forbidden) {
            onClose();
            return;
        }

        if (paymentsLoading) {
            return;
        }

        void withLoading(handleSubmit(paymentFacade.selectedProcessor));
    };

    const handlePaymentMethodChange = (value: PaymentMethodType) => {
        const newAvailablePaymentMethod = selectMethod(value);
        if (newAvailablePaymentMethod && checkResult && user) {
            checkoutTelemetry.reportSubscriptionEstimationChange({
                action: 'payment_method_changed',
                subscription: subscription,
                userCurrency: user.Currency,
                selectedPlanIDs: checkResult.requestData.Plans,
                selectedCurrency: checkResult.Currency,
                selectedCycle: checkResult.Cycle,
                selectedCoupon: checkResult.Coupon?.Code,
                paymentMethodValue: newAvailablePaymentMethod.value,
                paymentMethodType: newAvailablePaymentMethod.type,
                context: telemetryContext,
                build: APP_NAME,
                product: appName,
            });
        }

        const maybeNewCurrency = currencyOverride.updateCurrencyOverride(value);
        if (maybeNewCurrency) {
            selectCurrency(maybeNewCurrency).catch(noop);
        }
    };

    return (
        <>
            <form onSubmit={onSubmit}>
                <h2 className="text-2xl text-bold mt-8 mb-2">{c('Label').t`Payment details`}</h2>
                <p className="flex gap-1 color-weak m-0 items-center">
                    <IcLock />
                    <span>{c('Info').t`Your payment details are encrypted and secure`}</span>
                </p>
                {paymentMethodRequired && (
                    <PaymentMethodSelector
                        selectedMethodValue={selectedMethodValue}
                        methods={methods}
                        onPaymentMethodChange={(paymentMethod: PaymentMethodType) =>
                            handlePaymentMethodChange(paymentMethod)
                        }
                    />
                )}
                <PaymentMethodForm
                    paymentFacade={paymentFacade}
                    paymentMethodRequired={paymentMethodRequired}
                    vatNumber={vatNumber}
                    taxCountry={taxCountry}
                >
                    <SubscriptionConfirmButton
                        onDone={onClose}
                        currency={currency}
                        app={appName}
                        loading={
                            loading ||
                            subscribing ||
                            paymentFacade.bitcoinInhouse.bitcoinLoading ||
                            paymentFacade.bitcoinChargebee.bitcoinLoading
                        }
                        checkResult={checkResult}
                        className="w-full"
                        disabled={isFreeUserWithFreePlanSelected}
                        paymentForbiddenReason={paymentForbiddenReason}
                        subscription={subscription}
                        hasPaymentMethod={hasPaymentMethod}
                        taxCountry={taxCountry}
                        paymentFacade={paymentFacade}
                        couponConfig={couponConfig}
                        showVisionaryWarning={renderVisionaryDowngradeWarningText}
                        onSubmit={onSubmit}
                    />
                </PaymentMethodForm>
                {displayRenewNotice && (
                    <p className="color-weak text-sm" data-testid="checkout:renew-notice">
                        {getCheckoutRenewNoticeTextFromCheckResult({
                            checkResult,
                            plansMap,
                            planIDs,
                            subscription,
                            app: appName as APP_NAMES,
                        })}
                    </p>
                )}
            </form>
        </>
    );
};

export default SubscriptionCheckoutPaymentSection;
