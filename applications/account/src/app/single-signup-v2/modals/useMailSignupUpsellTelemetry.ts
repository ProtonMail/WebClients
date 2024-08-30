import { useApi } from '@proton/components';
import { TelemetryMailTrial2024UpsellModal, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import noop from '@proton/utils/noop';

const useMailSignupUpsellTelemetry = () => {
    const unauthApi = useApi();
    const sendTelemetry = (event: TelemetryMailTrial2024UpsellModal) => {
        return sendTelemetryReport({
            api: unauthApi,
            measurementGroup: TelemetryMeasurementGroups.mailSignup,
            event,
        }).catch(noop);
    };
    return {
        noThanks: () => {
            return sendTelemetry(TelemetryMailTrial2024UpsellModal.noThanks);
        },
        upsell: () => {
            return sendTelemetry(TelemetryMailTrial2024UpsellModal.upsell);
        },
        close: () => {
            return sendTelemetry(TelemetryMailTrial2024UpsellModal.closeModal);
        },
    };
};

export default useMailSignupUpsellTelemetry;
