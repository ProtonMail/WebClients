import { useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import PlusToPlusUpsell from '@proton/components/containers/payments/subscription/PlusToPlusUpsell';
import { useVisionaryDowngradeWarningModal } from '@proton/components/containers/payments/subscription/VisionaryDowngradeWarningModal';
import { getAllowedCycles } from '@proton/components/containers/payments/subscription/helpers';
import type { Currency, Cycle, PlanIDs } from '@proton/payments/core/interface';
import type { Plan, PlansMap } from '@proton/payments/core/plan/interface';
import { getIsPlanTransitionForbidden } from '@proton/payments/core/subscription/forbidden-plan-transition';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import noop from '@proton/utils/noop';

interface Props {
    subscription: Subscription;
    cycle: Cycle;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    currency: Currency;
    onPlusUpgrade: () => void;
}

const useSubscriptionPlanTransitionModals = ({
    subscription,
    plansMap,
    planIDs,
    currency,
    cycle,
    onPlusUpgrade,
}: Props) => {
    const [updatedPlanIds, setUpdatedPlanIds] = useState<PlanIDs>();
    const [updatedCycle, setUpdatedCycle] = useState<Cycle>();
    const [upsellModal, setUpsellModal, renderUpsellModal] = useModalState();
    const [plusToPlusUpsell, setPlusToPlusUpsell] = useState<{ unlockPlan: Plan | undefined } | null>(null);
    const {
        showVisionaryDowngradeWarning,
        hideVisionaryDowngradeWarning,
        visionaryDowngradeModal,
        renderVisionaryDowngradeWarningText,
    } = useVisionaryDowngradeWarningModal({ subscription });

    const initializePlanTransition = async () => {
        const planTransitionForbidden = getIsPlanTransitionForbidden({
            subscription,
            plansMap,
            planIDs,
        });

        hideVisionaryDowngradeWarning();
        if (planTransitionForbidden?.type === 'visionary-downgrade') {
            await showVisionaryDowngradeWarning().catch(noop);
            return true;
        } else if (planTransitionForbidden?.type === 'plus-to-plus') {
            setPlusToPlusUpsell({
                unlockPlan: planTransitionForbidden.newPlanName
                    ? plansMap[planTransitionForbidden.newPlanName]
                    : undefined,
            });
            setUpsellModal(true);
            return false;
        } else if (planTransitionForbidden?.type === 'lumo-plus') {
            const allowedCycles = getAllowedCycles({
                subscription,
                planIDs,
                plansMap,
                currency,
            });
            const preferredCycle = subscription?.Cycle ?? cycle;
            const newCycle = allowedCycles.includes(preferredCycle) ? preferredCycle : allowedCycles[0];

            setUpdatedPlanIds(planTransitionForbidden.newPlanIDs);
            setUpdatedCycle(newCycle);
            return true;
        }
        return true;
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
        overridePlanIds: updatedPlanIds,
        overrideCycle: updatedCycle,
        initializePlanTransition,
    };
};

export default useSubscriptionPlanTransitionModals;
