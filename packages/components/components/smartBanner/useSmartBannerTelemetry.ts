import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetrySmartBannerEvents } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

export const useSmartBannerTelemetry = (application: APP_NAMES) => {
    const api = useApi();

    return () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.smartBanner,
            event: TelemetrySmartBannerEvents.clickAppStoreLink,
            dimensions: { application },
        });
    };
};
