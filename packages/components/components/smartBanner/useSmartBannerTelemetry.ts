import { TelemetryMeasurementGroups, TelemetrySmartBannerEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import useApi from '../../hooks/useApi';
import type { SmartBannerApp } from './types';

export const useSmartBannerTelemetry = (application: SmartBannerApp) => {
    const api = useApi();

    return () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.smartBanner,
            event: TelemetrySmartBannerEvents.clickAppStoreLink,
            dimensions: { application },
            delay: false,
        });
    };
};
