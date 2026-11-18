import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';

import { getIsVisionaryUpsellEligible } from './helpers';

/**
 * Visionary upsell of the VPN dashboard. When the flag is off, the dashboard and the plan picker stay as they were.
 */
const useIsVisionaryUpsellEnabled = ({
    app,
    user,
    subscription,
    visionaryPlan,
}: {
    app: ProductParam;
    user: UserModel;
    subscription: MaybeFreeSubscription;
    visionaryPlan: Plan | undefined;
}) => {
    const isFlagEnabled = useFlag('VpnDashboardVisionaryUpsell');
    const vpnDashboardVariant = useVariant('VPNDashboard');

    return (
        isFlagEnabled &&
        vpnDashboardVariant.name === 'A' &&
        getIsVisionaryUpsellEligible({ app, user, subscription, visionaryPlan })
    );
};

export default useIsVisionaryUpsellEnabled;
