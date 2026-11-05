import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { usePreferredPlansMap } from '@proton/payments-hooks/ui/hooks/usePreferredPlansMap';
import type { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getPlan, getRenewalTime } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import { getShortPlan } from '../../features/plan';
import type { HighlightPlanDowngradeModalOwnProps } from '../HighlightPlanDowngradeModal';
import HighlightPlanDowngradeModal, { planSupportsCancellationDowngradeModal } from '../HighlightPlanDowngradeModal';
import type { SubscriptionCancellationStepConfig } from './types';

interface ShowProps {
    app: ProductParam;
    subscription: Subscription;
}

export const useHighlightPlanDowngradeStep = ({ canShow }: SubscriptionCancellationStepConfig) => {
    const [user] = useUser();
    const [plansResult] = usePlans();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const { plansMap } = usePreferredPlansMap();

    const [highlightPlanDowngradeModal, showHighlightPlanDowngradeModal] =
        useModalTwoPromise<HighlightPlanDowngradeModalOwnProps>();

    const modal = highlightPlanDowngradeModal(({ onResolve, onReject, ...props }) => {
        return <HighlightPlanDowngradeModal {...props} onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async ({ app, subscription }: ShowProps) => {
        if (!(await canShow(subscription))) {
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

        if (!planSupportsCancellationDowngradeModal(shortPlan.plan)) {
            return;
        }

        await showHighlightPlanDowngradeModal({
            user,
            plansMap,
            app,
            shortPlan,
            periodEnd: getRenewalTime(subscription),
            freePlan,
            subscription,
        });
    };

    return { modal, show };
};
