import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryExploreAppsEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

type OpenMethod = 'same_tab' | 'new_tab' | 'settings';

export const useExploreAppsListTelemetry = () => {
    const api = useApi();

    const sendPageLoad = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountExploreApps,
            event: TelemetryExploreAppsEvents.page_load,
            delay: false,
        });
        void telemetryReportsBatchQueue.flush();
    }, [api]);

    const sendAppClick = useCallback(
        ({ appName, openMethod }: { appName: APP_NAMES; openMethod: OpenMethod }) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountExploreApps,
                event: TelemetryExploreAppsEvents.app_click,
                delay: false,
                dimensions: {
                    app_name: appName,
                    open_method: openMethod,
                },
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    return { sendPageLoad, sendAppClick };
};
