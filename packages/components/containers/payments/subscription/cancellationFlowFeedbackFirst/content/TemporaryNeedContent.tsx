import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PLAN_NAMES, getPlanName } from '@proton/payments';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { B2BStoryCards } from '../components/B2BStoryCards';
import { B2CStoryCards } from '../components/B2CStoryCards';
import { ComparisonTable } from '../components/ComparisonTable';
import { getTemporaryNeedConfig } from '../config/temporaryNeedConfig';
import { useFeedbackFirstEligibility } from '../hooks/useFeedbackFirstEligibility';

interface Props {
    onKeepPlan: () => void;
    onContinueCancelling: () => void;
}

export const TemporaryNeedContent = ({ onKeepPlan, onContinueCancelling }: Props) => {
    const [subscription] = useSubscription();
    const [plansResult] = usePlans();
    const { hasB2BAccess, hasB2CAccess } = useFeedbackFirstEligibility();

    const planName = getPlanName(subscription);
    const plans = plansResult?.plans ?? [];
    const freePlan = plansResult?.freePlan ?? FREE_PLAN;
    const currentPlan = plans.find((p) => p.Name === planName);

    if (!currentPlan || !planName) {
        return null;
    }

    const planDisplayName = PLAN_NAMES[planName];
    const config = getTemporaryNeedConfig(currentPlan, freePlan);

    if (!config) {
        return null;
    }

    return (
        <>
            <ModalTwoHeader
                title={c('Title').t`What changes if you switch to the Free plan`}
                titleClassName="text-4xl"
            />
            <ModalTwoContent>
                <p className="mb-12">{config.subtitle}</p>
                <ComparisonTable
                    leftHeader={config.currentPlanHeader}
                    rightHeader={config.freePlanHeader}
                    features={config.features}
                />

                {hasB2BAccess && (
                    <>
                        <p>{c('Info')
                            .t`Your ${planDisplayName} plan doesn’t just keep your business data and communications safe. It supports your compliance objectives, makes your business stand out, and keeps your team connected.`}</p>
                        <B2BStoryCards />
                    </>
                )}
                {hasB2CAccess && (
                    <>
                        <p>
                            {c('Paragraph')
                                .t`${BRAND_NAME} is independently funded and operates without advertising. Below are examples of how this independence has been used in practice.`}
                        </p>
                        <B2CStoryCards />
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end gap-2">
                <Button shape="outline" color="weak" onClick={onKeepPlan}>
                    {c('Temporary need').t`Keep current plan`}
                </Button>
                <Button color="danger" onClick={onContinueCancelling}>
                    {c('Temporary need').t`Continue cancelling`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
