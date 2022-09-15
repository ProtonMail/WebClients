import { metrics } from '../api/metrics';
import { TelemetryEvents, TelemetryMeasurementGroups, sendTelemetryData } from '../api/telemetry';
import { METRICS_LOG, SECOND } from '../constants';
import { Api, SimpleMap } from '../interfaces';
import { wait } from './promise';

let metricsEnabled = true;

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

/**
 * Send a telemetry report (/data/v1/stats endpoint)
 */
export const sendTelemetryReport = async (
    api: Api,
    measurementGroup: TelemetryMeasurementGroups,
    event: TelemetryEvents,
    values?: SimpleMap<number>,
    dimensions?: SimpleMap<string>
) => {
    if (!metricsEnabled) {
        return;
    }

    void api(
        sendTelemetryData({
            MeasurementGroup: measurementGroup,
            Event: event,
            Values: values || {},
            Dimensions: dimensions,
        })
    );
};

export const setMetricsEnabled = (enabled: boolean) => {
    metricsEnabled = enabled;
};
