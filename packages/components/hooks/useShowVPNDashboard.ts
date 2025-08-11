import { useMemo } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { getIsB2BAudienceFromSubscription } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';
import { useFlag, useVariant } from '@proton/unleash';

const useShowVPNDashboard = (app: APP_NAMES) => {
    const [organization] = useOrganization();
    const [subscription] = useSubscription();
    const isVPNDashboardEnabled = useFlag('VPNDashboard');
    const showVPNDashboardVariant = useVariant('VPNDashboard');

    const isB2B = getIsB2BAudienceFromSubscription(subscription) || isOrganizationB2B(organization);

    const canShowVPNDashboard = useMemo(() => {
        return app === APPS.PROTONVPN_SETTINGS && !isB2B && isVPNDashboardEnabled;
    }, [app, isB2B, isVPNDashboardEnabled]);

    const showVPNDashboard = useMemo(() => {
        return canShowVPNDashboard && showVPNDashboardVariant.name !== 'Control';
    }, [canShowVPNDashboard, showVPNDashboardVariant]);

    return { showVPNDashboard, showVPNDashboardVariant, canShowVPNDashboard };
};

export default useShowVPNDashboard;
