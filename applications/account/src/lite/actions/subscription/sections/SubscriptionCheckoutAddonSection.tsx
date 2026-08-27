import { c } from 'ttag';

import { getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import { ProtonPlanCustomizer } from '@proton/components/containers/payments/planCustomizer/ProtonPlanCustomizer';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { usePayments } from '@proton/payments-ui/ui/context/PaymentContext';
import { ADDON_PREFIXES } from '@proton/payments/core/constants';

const SubscriptionCheckoutAddonSection = () => {
    const { checkoutUi, plansMap, subscription, selectPlanIDs, telemetryContext, loading, couponConfig } =
        usePayments();
    const { cycle, planIDs, currency } = checkoutUi;
    const scribeEnabled = useAssistantFeatureEnabled();

    if (subscription && getHasPlanCustomizer(planIDs)) {
        const latestSubscription = subscription.UpcomingSubscription ?? subscription;

        const header = <h2 className="text-2xl text-bold mt-8 mb-4">{c('Label').t`Add extra services`}</h2>;

        return (
            <ProtonPlanCustomizer
                currency={currency}
                cycle={cycle}
                plansMap={plansMap}
                selectedPlanIDs={planIDs}
                onChangePlanIDs={selectPlanIDs}
                loading={loading}
                latestSubscription={latestSubscription}
                addonFlags={{
                    [ADDON_PREFIXES.SCRIBE]: scribeEnabled.paymentsEnabled,
                }}
                couponConfig={couponConfig}
                telemetryContext={telemetryContext}
                header={header}
            />
        );
    }
    return null;
};

export default SubscriptionCheckoutAddonSection;
