import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { User } from '@proton/shared/lib/interfaces/User';

import { getTelemetryUserTier } from '../../../../../../helpers/getTelemetryUserTier';

export type VisionaryUpsellCta =
    | 'discover_visionary'
    | 'discover_unlimited_card'
    | 'compare_plans_visionary_window'
    | 'compare_plans_unlimited_window';

export const sendVisionaryUpsellCtaClick = ({
    api,
    app,
    user,
    cta,
}: {
    api: Api;
    app: APP_NAMES;
    user: User;
    cta: VisionaryUpsellCta;
}) => {
    void sendTelemetryReport({
        api,
        delay: false,
        event: TelemetryAccountDashboardEvents.upsellCtaClick,
        measurementGroup: TelemetryMeasurementGroups.accountDashboard,
        dimensions: {
            app,
            cta,
            user_tier: getTelemetryUserTier(user),
        },
    });
};
