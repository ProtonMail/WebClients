import { useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import PlusToPlusUpsell from '@proton/components/containers/payments/subscription/PlusToPlusUpsell';
import { useVisionaryDowngradeWarningModal } from '@proton/components/containers/payments/subscription/VisionaryDowngradeWarningModal';
import { getAllowedCycles } from '@proton/components/containers/payments/subscription/helpers/getAllowedCycles';
import type { Currency, Cycle, FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { getIsPlanTransitionForbidden } from '@proton/payments/core/subscription/forbidden-plan-transition';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import { getChangedSubscription } from '@proton/payments/core/subscription/purchase-outcome';
import type { Plan, PlansMap } from '@proton/shared/lib/payments/plan/interface';
import noop from '@proton/utils/noop';

type PlanTransition = { proceed: false } | { proceed: true; planIDs: PlanIDs; cycle: Cycle };

interface Props {
    subscription: Subscription | FreeSubscription;
    cycle: Cycle;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    currency: Currency;
    onPlusUpgrade: () => void;
    multiSubscriptionContext: MultiSubscriptionContext;
}

const useSubscriptionPlanTransitionModals = ({
    subscription,
    plansMap,
    planIDs,
    currency,
    cycle,
    onPlusUpgrade,
    multiSubscriptionContext,
}: Props) => {
    const changedSubscription = getChangedSubscription(multiSubscriptionContext, planIDs);
    const [upsellModal, setUpsellModal, renderUpsellModal] = useModalState();
    const [plusToPlusUpsell, setPlusToPlusUpsell] = useState<{ unlockPlan: Plan | undefined } | null>(null);
    const {
        showVisionaryDowngradeWarning,
        hideVisionaryDowngradeWarning,
        visionaryDowngradeModal,
        renderVisionaryDowngradeWarningText,
    } = useVisionaryDowngradeWarningModal({ subscription });

    const initializePlanTransition = async (): Promise<PlanTransition> => {
        const planTransitionForbidden = getIsPlanTransitionForbidden({
            subscription: changedSubscription,
            plansMap,
            planIDs,
            multiSubscriptionContext,
        });

        hideVisionaryDowngradeWarning();
        if (planTransitionForbidden?.type === 'visionary-downgrade') {
            await showVisionaryDowngradeWarning().catch(noop);
            return { proceed: true, planIDs, cycle };
        } else if (planTransitionForbidden?.type === 'plus-to-plus') {
            setPlusToPlusUpsell({
                unlockPlan: planTransitionForbidden.newPlanName
                    ? plansMap[planTransitionForbidden.newPlanName]
                    : undefined,
            });
            setUpsellModal(true);
            return { proceed: false };
        } else if (planTransitionForbidden?.type === 'lumo-plus') {
            const allowedCycles = getAllowedCycles({
                subscription: changedSubscription,
                planIDs,
                plansMap,
                currency,
            });
            const preferredCycle = changedSubscription?.Cycle ?? cycle;
            const newCycle = allowedCycles.includes(preferredCycle) ? preferredCycle : allowedCycles[0];

            return { proceed: true, planIDs: planTransitionForbidden.newPlanIDs, cycle: newCycle };
        }
        return { proceed: true, planIDs, cycle };
    };

    const plusToPlusUpsellModal = renderUpsellModal && plusToPlusUpsell && (
        <PlusToPlusUpsell
            {...upsellModal}
            unlockPlan={plusToPlusUpsell.unlockPlan}
            plansMap={plansMap}
            onUpgrade={() => {
                upsellModal.onClose();
                onPlusUpgrade();
            }}
            onClose={() => {
                upsellModal.onClose();
            }}
        />
    );
    return {
        plusToPlusUpsellModal,
        visionaryDowngradeModal,
        renderVisionaryDowngradeWarningText,
        initializePlanTransition,
    };
};

export default useSubscriptionPlanTransitionModals;
