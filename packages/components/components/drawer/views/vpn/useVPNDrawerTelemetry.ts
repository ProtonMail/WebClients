import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryVPNDrawerEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

const useVPNDrawerTelemetry = () => {
    const api = useApi();

    return {
        spotlightIsDisplayed: () => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnDrawer,
                event: TelemetryVPNDrawerEvents.tooltip_displayed,
                delay: false,
            });
        },
        spotlightIsClicked: () => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnDrawer,
                event: TelemetryVPNDrawerEvents.tooltip_clicked,
                delay: false,
            });
        },
        spotlightIsDismissed: () => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnDrawer,
                event: TelemetryVPNDrawerEvents.tooltip_dismissed,
                delay: false,
            });
        },
        dashboardIsDisplayed: () => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnDrawer,
                event: TelemetryVPNDrawerEvents.drawer_displayed,
                delay: false,
            });
        },
        downloadIsClicked: () => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnDrawer,
                event: TelemetryVPNDrawerEvents.download_clicked,
                delay: false,
            });
        },
        statusChanged: () => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnDrawer,
                event: TelemetryVPNDrawerEvents.status_changed,
                delay: false,
            });
        },
    };
};

export default useVPNDrawerTelemetry;
