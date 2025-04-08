import useVPNDashboardPageLoadTelemetry from '@proton/components/hooks/useVPNDashboardPageLoadTelemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';

const VPNDashboardTelemetry = ({ app }: { app: APP_NAMES }) => {
    useVPNDashboardPageLoadTelemetry({ app });

    return null;
};

export default VPNDashboardTelemetry;
