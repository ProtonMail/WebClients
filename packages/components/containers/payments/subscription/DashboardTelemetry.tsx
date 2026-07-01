import { useUser } from '@proton/account/user/hooks';
import { getTelemetryUserTier } from '@proton/components/helpers/getTelemetryUserTier';
import { getDashboardFeatureFlag } from '@proton/components/hooks/accounts/useShowDashboard';
import useDashboardPageLoadTelemetry from '@proton/components/hooks/useDashboardPageLoadTelemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';

const DashboardTelemetry = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const userTier = getTelemetryUserTier(user);
    useDashboardPageLoadTelemetry({ app, dashboardName: getDashboardFeatureFlag(app), userTier });

    return null;
};

export default DashboardTelemetry;
