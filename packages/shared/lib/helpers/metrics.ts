import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { metrics } from '../api/metrics';
import { TelemetryReport, sendMultipleTelemetryData, sendTelemetryData } from '../api/telemetry';
import { METRICS_LOG, SECOND } from '../constants';
import { Api } from '../interfaces';
import { wait } from './promise';

// Make the metrics false by default to avoid (rare) cases where we could have sendMetricReport or sendTelemetryReport
// before setting this metricsEnabled value with the user setting.
// In that scenario we would send something but the user might not want this.
let metricsEnabled = false;

/**
 * Delay an operation by a random number of seconds between 1 second and the specified
 * number of seconds. If none is provided, the default is 180 seconds, i.e. 3 minutes
 */
export const randomDelay = async (delayInSeconds: number = 180) => {
    await wait(SECOND * Math.floor(delayInSeconds * Math.random() + 1));
};

/**
 * Send metrics report (/metrics endpoint)
 */
export const sendMetricsReport = async (api: Api, Log: METRICS_LOG, Title?: string, Data?: any) => {
    if (!metricsEnabled) {
        return;
    }
    // We delay sending the metrics report because this helper is used in some privacy-sensitive
    // use-cases, e.g. encrypted search, in which we don't want the server to be able to use the
    // metric report as a distinguisher to correlate user actions, e.g. performing an encrypted
    // search and fetching an email shortly after
    await randomDelay();
    void api(metrics({ Log, Title, Data }));
};

interface SendTelemetryReportArgs extends TelemetryReport {
    api: Api;
    silence?: boolean;
}

/**
 * Send a telemetry report (/data/v1/stats endpoint)
 */
export const sendTelemetryReport = async ({
    api,
    measurementGroup,
    event,
    values,
    dimensions,
    silence = true,
}: SendTelemetryReportArgs) => {
    const possiblySilentApi = silence ? getSilentApi(api) : api;

    if (!metricsEnabled) {
        return;
    }

    try {
        void (await possiblySilentApi(
            sendTelemetryData({
                MeasurementGroup: measurementGroup,
                Event: event,
                Values: values,
                Dimensions: dimensions,
            })
        ));
    } catch {
        // fail silently
    }
};

interface SendMultipleTelemetryReportsArgs {
    api: Api;
    reports: TelemetryReport[];
    silence?: boolean;
}

/**
 * Send multiple telemetry reports (/data/v1/stats/multiple endpoint)
 */
export const sendMultipleTelemetryReports = async ({
    api,
    reports,
    silence = true,
}: SendMultipleTelemetryReportsArgs) => {
    const possiblySilentApi = silence ? getSilentApi(api) : api;

    if (!metricsEnabled) {
        return;
    }

    try {
        void (await possiblySilentApi(sendMultipleTelemetryData({ reports })));
    } catch {
        // fail silently
    }
};

export const setMetricsEnabled = (enabled: boolean) => {
    metricsEnabled = enabled;
};
