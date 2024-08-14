import { useApi } from '@proton/components/hooks';
import type { TelemetryEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups, TelemetryProtonTipsEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

import type { TipActionType } from 'proton-mail/models/tip';

const useProtonTipsTelemetry = () => {
    const api = useApi();

    const sendReport = (event: TelemetryEvents, dimensions?: SimpleMap<string>) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailProtonTips,
            event,
            dimensions: {
                ...dimensions,
            },
        });
    };

    const sendTipDisplayedReport = (tipName: TipActionType) => {
        sendReport(TelemetryProtonTipsEvents.tipDispayed, { tip_name: tipName });
    };

    const sendCTAButtonClickedReport = (tipName: TipActionType) => {
        sendReport(TelemetryProtonTipsEvents.CTAButtonClicked, { tip_name: tipName });
    };

    return {
        sendTipDisplayedReport,
        sendCTAButtonClickedReport,
    };
};

export default useProtonTipsTelemetry;
