import { getDashboardFeatureFlag } from '@proton/components/hooks/accounts/useShowDashboard';
import useDashboardPageLoadTelemetry from '@proton/components/hooks/useDashboardPageLoadTelemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';

const DashboardTelemetry = ({ app }: { app: APP_NAMES }) => {
    useDashboardPageLoadTelemetry({ app, dashboardName: getDashboardFeatureFlag(app) });

    return null;
};

export default DashboardTelemetry;
