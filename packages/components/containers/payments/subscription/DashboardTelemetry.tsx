import { useUser } from '@proton/account/user/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { getTelemetryUserTier } from '../../../helpers/getTelemetryUserTier';
import useDashboardPageLoadTelemetry from '../../../hooks/useDashboardPageLoadTelemetry';

const DashboardTelemetry = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const userTier = getTelemetryUserTier(user);
    useDashboardPageLoadTelemetry({ app, userTier });

    return null;
};

export default DashboardTelemetry;
