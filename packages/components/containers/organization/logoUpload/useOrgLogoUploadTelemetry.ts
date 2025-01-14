import useApi from '@proton/components/hooks/useApi';
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
            delay: false,
        });
    };

    const sendOrgLogoUploadSuccessReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountOrgLogoUpload,
            event: TelemetryAccountOrganizationLogoUploadEvents.processSuccess,
            delay: false,
        });
    };

    const sendOrgLogoUploadFailureReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountOrgLogoUpload,
            event: TelemetryAccountOrganizationLogoUploadEvents.processFailure,
            delay: false,
        });
    };

    return {
        sendOrgLogoUploadStartProcessReport,
        sendOrgLogoUploadSuccessReport,
        sendOrgLogoUploadFailureReport,
    };
};

export default useOrgLogoUploadTelemetry;
