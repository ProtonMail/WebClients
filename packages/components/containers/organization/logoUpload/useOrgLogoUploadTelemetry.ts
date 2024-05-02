import { useApi } from '@proton/components/hooks';
import {
    TelemetryAccountOrganizationLogoUploadEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

const useOrgLogoUploadTelemetry = () => {
    const api = useApi();

    const sendOrgLogoUploadStartProcessReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountOrgLogoUpload,
            event: TelemetryAccountOrganizationLogoUploadEvents.processStart,
        });
    };

    const sendOrgLogoUploadSuccessReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountOrgLogoUpload,
            event: TelemetryAccountOrganizationLogoUploadEvents.processSuccess,
        });
    };

    const sendOrgLogoUploadFailureReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountOrgLogoUpload,
            event: TelemetryAccountOrganizationLogoUploadEvents.processFailure,
        });
    };

    return {
        sendOrgLogoUploadStartProcessReport,
        sendOrgLogoUploadSuccessReport,
        sendOrgLogoUploadFailureReport,
    };
};

export default useOrgLogoUploadTelemetry;
