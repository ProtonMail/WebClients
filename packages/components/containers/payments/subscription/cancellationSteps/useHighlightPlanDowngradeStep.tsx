import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { FREE_PLAN, type PLANS, getPlan, getRenewalTime } from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';

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
    const [vpnServers] = useVPNServersCount();

    const [highlightPlanDowngradeModal, showHighlightPlanDowngradeModal] =
        useModalTwoPromise<HighlightPlanDowngradeModalOwnProps>();

    const modal = highlightPlanDowngradeModal(({ onResolve, onReject, ...props }) => {
        return <HighlightPlanDowngradeModal {...props} onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async ({ app, cancellationFlow }: ShowProps) => {
        if (!(await canShow())) {
            return;
        }

        if (!subscription) {
            return;
        }

        const currentPlan = getPlan(subscription);
        const shortPlan = currentPlan
            ? getShortPlan(currentPlan.Name as PLANS, plansMap, {
                  vpnServers,
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
