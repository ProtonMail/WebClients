import { c } from 'ttag';

import { getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import { ProtonPlanCustomizer } from '@proton/components/containers/payments/planCustomizer/ProtonPlanCustomizer';
import { showLumoAddonCustomizer } from '@proton/components/containers/payments/subscription/modal-components/helpers/showLumoAddonCustomizer';
import { showMeetAddonCustomizer } from '@proton/components/containers/payments/subscription/modal-components/helpers/showMeetAddonCustomizer';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';

const SubscriptionCheckoutAddonSection = () => {
    const { checkoutUi, plansMap, subscription, selectPlanIDs, telemetryContext, loading, couponConfig } =
        usePayments();
    const { cycle, planIDs, currency } = checkoutUi;
    const scribeEnabled = useAssistantFeatureEnabled();

    if (subscription && getHasPlanCustomizer(planIDs)) {
        const latestSubscription = subscription.UpcomingSubscription ?? subscription;
        const lumoAddonEnabled = showLumoAddonCustomizer({
            subscription,
            couponConfig,
            planIDs,
        });
        const meetAddonEnabled = showMeetAddonCustomizer({ couponConfig, planIDs });

        return (
            <>
                <h2 className="text-2xl text-bold mt-8 mb-4">{c('Label').t`Add extra services`}</h2>
                <ProtonPlanCustomizer
                    currency={currency}
                    cycle={cycle}
                    plansMap={plansMap}
                    selectedPlanIDs={planIDs}
                    onChangePlanIDs={selectPlanIDs}
                    loading={loading}
                    latestSubscription={latestSubscription}
                    addonFlags={{
                        scribeAddonEnabled: scribeEnabled.paymentsEnabled,
                        lumoAddonEnabled,
                        meetAddonEnabled,
                    }}
                    telemetryContext={telemetryContext}
                />
            </>
        );
    }
    return null;
};

export default SubscriptionCheckoutAddonSection;
