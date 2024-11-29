import { TelemetryInboxDestkopEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';

import type { DailyStatsReport } from './DailyStats';
import type { DefaultProtocol } from './DefaultProtocol';
import { getInboxDesktopInfo, invokeInboxDesktopIPC } from './ipcHelpers';

type MailtoDimensions = {
    isDefault: 'true' | 'false' | 'unknown';
    changeSinceLast: 'yes_to_no' | 'no_to_yes' | 'no_change';
};

export const getDefaultMailto = () => getInboxDesktopInfo('defaultMailto');
export const checkDefaultMailto = () => invokeInboxDesktopIPC({ type: 'checkDefaultMailtoAndSignal' });
const defaultMailtoTelemetryReported = (timestamp: number) =>
    invokeInboxDesktopIPC({ type: 'defaultMailtoTelemetryReported', payload: timestamp });

export const sendMailtoTelemetry = (api: Api, data: DefaultProtocol, timestamp: number) => {
    const dimensions: MailtoDimensions = {
        isDefault: 'unknown',
        changeSinceLast: 'no_change',
    };

    if (data.wasChecked) {
        dimensions.isDefault = data.isDefault ? 'true' : 'false';

        if (data.lastReport.wasDefault && !data.isDefault) {
            dimensions.changeSinceLast = 'yes_to_no';
        }
        if (!data.lastReport.wasDefault && data.isDefault) {
            dimensions.changeSinceLast = 'no_to_yes';
        }
    }

    void sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.mailDesktopDefaultMailto,
        event: TelemetryInboxDestkopEvents.mailto_heartbeat,
        dimensions,
    });

    void defaultMailtoTelemetryReported(timestamp);
};

export const getDailyStats = () => getInboxDesktopInfo('dailyStats');
export const checkDailyStats = () => invokeInboxDesktopIPC({ type: 'checkDailyStatsAndSignal' });
const dailyStatsReported = (timestamp: number) =>
    invokeInboxDesktopIPC({ type: 'dailyStatsReported', payload: timestamp });

export const sendDailyTelemetry = (api: Api, data: DailyStatsReport, timestamp: number) => {
    void sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.mailDesktopDailyStats,
        event: TelemetryInboxDestkopEvents.daily_stats_heartbeat,
        ...data,
    });

    void dailyStatsReported(timestamp);
};
