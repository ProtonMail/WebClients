import { useEffect } from 'react';

import { useAppName } from '@proton/account/appName';
import CalendarDowngradeModal from '@proton/components/containers/payments/subscription/CalendarDowngradeModal';
import type { Model } from '@proton/components/containers/payments/subscription/SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { PLANS } from '@proton/payments/core/constants';
import { isLifetimePlanSelected } from '@proton/payments/core/plan/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { PaymentsContextProvider, usePayments } from '@proton/payments/ui/context/PaymentContext';
import { getPlanToCheck } from '@proton/payments/ui/context/helpers';
import noop from '@proton/utils/noop';

import type { SubscriptionCheckoutMetricsOverrides } from './interface';
import SubscriptionCheckoutAddonSection from './sections/SubscriptionCheckoutAddonSection';
import SubscriptionCheckoutBillingCycleSection from './sections/SubscriptionCheckoutBillingCycleSection';
import SubscriptionCheckoutPaymentSection from './sections/SubscriptionCheckoutPaymentSection';
import SubscriptionCheckoutPlanSection from './sections/SubscriptionCheckoutPlanSection';
import useSubscriptionCheckout from './useSubscriptionCheckout';
import useSubscriptionPlanTransitionModals from './useSubscriptionPlanTransitionModals';

interface Props {
    onStepChange: (step: SUBSCRIPTION_STEPS) => void;
    checkoutModel: Model;
    onSubscribed: () => void;
    onUnsubscribed: () => void;
    onClose: () => void;
    metrics: SubscriptionCheckoutMetricsOverrides;
    subscription: Subscription;
    minimumCycle?: number;
}

const SubscriptionCheckoutWithPayments = ({
    onStepChange,
    checkoutModel,
    onSubscribed,
    onUnsubscribed,
    onClose,
    metrics,
    subscription,
    minimumCycle,
}: Props) => {
    const { initialize, plansMap, selectNewPlan } = usePayments();
    const api = useSilentApi();
    const app = useAppName();

    const {
        shouldDisableCurrencySelection,
        availableCurrencies,
        paymentFacade,
        subscribing,
        calendarDowngradeModal,
        cancelSubscriptionModals,
    } = useSubscriptionCheckout({
        onStepChange,
        onSubscribed,
        onUnsubscribed,
        metrics,
    });

    const handleUnlimitedUpgrade = () => {
        selectNewPlan({
            ...getPlanToCheck({
                planIDs: {
                    [PLANS.BUNDLE]: 1,
                },
                currency: checkoutModel.currency,
                cycle: checkoutModel.cycle,
            }),
        }).catch(noop);
    };
    const {
        plusToPlusUpsellModal,
        overrideCycle,
        overridePlanIds,
        renderVisionaryDowngradeWarningText,
        visionaryDowngradeModal,
        initializePlanTransition,
    } = useSubscriptionPlanTransitionModals({
        currency: checkoutModel.currency,
        cycle: checkoutModel.cycle,
        planIDs: checkoutModel.planIDs,
        plansMap,
        subscription,
        onPlusUpgrade: handleUnlimitedUpgrade,
    });
    const lifetimePlan = isLifetimePlanSelected(checkoutModel.planIDs);

    useEffect(() => {
        void (async () => {
            const shouldInitializePayments = await initializePlanTransition();
            if (shouldInitializePayments) {
                await initialize({
                    api,
                    paymentFlow: 'subscription',
                    telemetryContext: 'subscription-modification',
                    product: app,
                    paramCurrency: checkoutModel.currency,
                    onChargeable: async () => undefined,
                    planToCheck: {
                        coupon: checkoutModel.coupon,
                        cycle: overrideCycle ?? checkoutModel.cycle,
                        planIDs: overridePlanIds ?? checkoutModel.planIDs,
                    },
                });
            }
        })();
    }, []);

    return (
        <>
            <SubscriptionCheckoutPlanSection
                hasSavedPaymentMethods={
                    !!(paymentFacade.methods.savedMethods && paymentFacade.methods.savedMethods.length > 0)
                }
                availableCurrencies={availableCurrencies}
                shouldDisableCurrencySelection={shouldDisableCurrencySelection}
                onChangePlan={() => onStepChange(SUBSCRIPTION_STEPS.PLAN_SELECTION)}
            />
            {!lifetimePlan && <SubscriptionCheckoutBillingCycleSection minimumCycle={minimumCycle} />}
            <SubscriptionCheckoutAddonSection initialCoupon={checkoutModel.coupon} />
            <SubscriptionCheckoutPaymentSection
                subscribing={subscribing}
                paymentFacade={paymentFacade}
                onClose={onClose}
                renderVisionaryDowngradeWarningText={renderVisionaryDowngradeWarningText}
            />
            {cancelSubscriptionModals}
            {visionaryDowngradeModal}
            {plusToPlusUpsellModal}
            {calendarDowngradeModal(({ onResolve, onReject, ...props }) => (
                <CalendarDowngradeModal {...props} isDowngrade={false} onConfirm={onResolve} onClose={onReject} />
            ))}
        </>
    );
};

const SubscriptionCheckout = (props: Props) => {
    return (
        <PaymentsContextProvider>
            <SubscriptionCheckoutWithPayments {...props} />
        </PaymentsContextProvider>
    );
};

export default SubscriptionCheckout;
