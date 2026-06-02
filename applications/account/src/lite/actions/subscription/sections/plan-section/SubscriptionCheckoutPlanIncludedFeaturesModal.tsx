import { ModalTwo, ModalTwoContent } from '@proton/components';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { getShortPlan } from '@proton/components/containers/payments/features/plan';
import { PlanCardFeaturesShort } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';

const SubscriptionCheckoutPlanIncludedFeaturesModal = ({ ...modalProps }: ModalStateProps) => {
    const { plansMap, freePlan, checkoutUi } = usePayments();
    const { planName } = checkoutUi;

    const shortPlan = getShortPlan(planName, plansMap, { freePlan });

    if (!shortPlan) {
        return null;
    }

    return (
        <ModalTwo {...modalProps} size="large" fullscreenOnMobile={true}>
            <ModalTwoHeader title={shortPlan.title} hasClose={true} subline={shortPlan.description} />
            <ModalTwoContent>
                <PlanCardFeaturesShort plan={shortPlan} icon={false} />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default SubscriptionCheckoutPlanIncludedFeaturesModal;
