import { useApi, useSubscription } from '@proton/components/hooks';
import type { TelemetryEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups, TelemetryProtonTipsEvents } from '@proton/shared/lib/api/telemetry';
import { PLANS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

import type { TipActionType } from 'proton-mail/models/tip';

const useProtonTipsTelemetry = () => {
    const api = useApi();
    const [subscription] = useSubscription();
    const plan: PLANS = getPlan(subscription)?.Name || PLANS.FREE;

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
        sendReport(TelemetryProtonTipsEvents.tipDispayed, { tip_name: tipName, plan });
    };

    const sendCTAButtonClickedReport = (tipName: TipActionType) => {
        sendReport(TelemetryProtonTipsEvents.CTAButtonClicked, { tip_name: tipName, plan });
    };

    const sendCloseButtonClickedReport = (tipName: TipActionType) => {
        sendReport(TelemetryProtonTipsEvents.closeButtonClicked, { tip_name: tipName, plan });
    };

    const sendTipSnoozedReport = (tipName: TipActionType) => {
        sendReport(TelemetryProtonTipsEvents.tipSnoozed, { tip_name: tipName, plan });
    };

    return {
        sendTipDisplayedReport,
        sendCTAButtonClickedReport,
        sendCloseButtonClickedReport,
        sendTipSnoozedReport,
    };
};

export default useProtonTipsTelemetry;
