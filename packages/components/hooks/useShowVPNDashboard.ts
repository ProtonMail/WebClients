import { useMemo } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { hasB2BPlan } from '@proton/shared/lib/helpers/subscription';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';
import { useFlag, useVariant } from '@proton/unleash';

const useShowVPNDashboard = (app: APP_NAMES) => {
    const [organization] = useOrganization();
    const [subscription] = useSubscription();
    const isVPNDashboardEnabled = useFlag('VPNDashboard');
    const showVPNDashboardVariant = useVariant('VPNDashboard');

    const isB2B = hasB2BPlan(subscription) || isOrganizationB2B(organization);

    const showVPNDashboard = useMemo(() => {
        return (
            app === APPS.PROTONVPN_SETTINGS &&
            !isB2B &&
            isVPNDashboardEnabled &&
            showVPNDashboardVariant.name !== 'Control'
        );
    }, [app, isB2B, isVPNDashboardEnabled, showVPNDashboardVariant]);

    return { showVPNDashboard, showVPNDashboardVariant };
};

export default useShowVPNDashboard;
