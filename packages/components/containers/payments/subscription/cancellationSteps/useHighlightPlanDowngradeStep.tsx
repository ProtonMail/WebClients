import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getPlan, getRenewalTime } from '@proton/payments/core/subscription/helpers';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import { usePreferredPlansMap } from '../../../../hooks/usePreferredPlansMap';
import { getShortPlan } from '../../features/plan';
import type { HighlightPlanDowngradeModalOwnProps } from '../HighlightPlanDowngradeModal';
import HighlightPlanDowngradeModal, { planSupportsCancellationDowngradeModal } from '../HighlightPlanDowngradeModal';
import type { CancellationStepConfig } from './types';

interface ShowProps {
    app: ProductParam;
    cancellationFlow: boolean;
}

export const useHighlightPlanDowngradeStep = ({ canShow }: CancellationStepConfig) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [plansResult] = usePlans();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const { plansMap } = usePreferredPlansMap();

    const [highlightPlanDowngradeModal, showHighlightPlanDowngradeModal] =
        useModalTwoPromise<HighlightPlanDowngradeModalOwnProps>();

    const modal = highlightPlanDowngradeModal(({ onResolve, onReject, ...props }) => {
        return <HighlightPlanDowngradeModal {...props} onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async ({ app, cancellationFlow }: ShowProps) => {
        if (!(await canShow())) {
            return;
        }

        if (!isPaidSubscription(subscription)) {
            return;
        }

        const currentPlan = getPlan(subscription);
        const shortPlan = currentPlan
            ? getShortPlan(currentPlan.Name as PLANS, plansMap, {
                  freePlan,
              })
            : undefined;

        if (!shortPlan) {
            return;
        }

        if (cancellationFlow && !planSupportsCancellationDowngradeModal(shortPlan.plan)) {
            return;
        }

        await showHighlightPlanDowngradeModal({
            user,
            plansMap,
            app,
            shortPlan,
            periodEnd: getRenewalTime(subscription),
            freePlan,
            cancellationFlow,
            subscription,
        });
    };

    return { modal, show };
};
