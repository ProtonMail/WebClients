import { useMemo } from 'react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';

const useShowVPNDashboard = (app: APP_NAMES) => {
    const [entitlements] = useEntitlementChecksForOrgAndUser();
    const isVPNDashboardEnabled = useFlag('VPNDashboard');
    const showVPNDashboardVariant = useVariant('VPNDashboard');

    const isB2B = entitlements.isB2B;

    const canShowVPNDashboard = useMemo(() => {
        return app === APPS.PROTONVPN_SETTINGS && !isB2B && isVPNDashboardEnabled;
    }, [app, isB2B, isVPNDashboardEnabled]);

    const showVPNDashboard = useMemo(() => {
        return canShowVPNDashboard && showVPNDashboardVariant.name !== 'Control';
    }, [canShowVPNDashboard, showVPNDashboardVariant]);

    return { showVPNDashboard, showVPNDashboardVariant, canShowVPNDashboard };
};

export default useShowVPNDashboard;
