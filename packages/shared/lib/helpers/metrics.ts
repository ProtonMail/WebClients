import { isFreeSubscription } from '@proton/payments';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getIsB2BAudienceFromSubscription, getPlanName } from '@proton/shared/lib/helpers/subscription';
import type { Subscription, UserModel, UserSettings } from '@proton/shared/lib/interfaces';

import { metrics } from '../api/metrics';
import type { TelemetryReport } from '../api/telemetry';
import { sendMultipleTelemetryData, sendTelemetryData } from '../api/telemetry';
import type { METRICS_LOG } from '../constants';
import { SECOND } from '../constants';
import type { Api } from '../interfaces';
import { getAccountAgeForDimension } from './metrics.helpers';
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

interface SendTelemetryReportWithBaseDimensionArgs extends SendTelemetryReportArgs {
    api: Api;
    user: UserModel;
    subscription?: Subscription;
    userSettings?: UserSettings;
    silence?: boolean;
}

/**
 * Send a telemetry report with basic dimensions already setup uses /data/v1/stats endpoint
 *   - account_age
 *   - user_locale
 *   - subscription
 *   - audience
 *   - is_free
 */
export const sendTelemetryReportWithBaseDimensions = async ({
    api,
    user,
    subscription,
    userSettings,
    measurementGroup,
    event,
    values,
    dimensions,
    silence = true,
}: SendTelemetryReportWithBaseDimensionArgs) => {
    const subscriptionName = isFreeSubscription(subscription) ? 'free' : getPlanName(subscription);

    let audience = 'free';
    if (getIsB2BAudienceFromSubscription(subscription)) {
        audience = 'b2b';
    } else if (!user.isFree) {
        audience = 'b2c';
    }

    void sendTelemetryReport({
        api,
        measurementGroup,
        event,
        values,
        silence,
        dimensions: {
            ...dimensions,
            // Base dimensions used to help get basic knowledge about the user
            account_age: getAccountAgeForDimension(user),
            user_locale: userSettings?.Locale ?? 'undefined',
            subscription: subscriptionName,
            audience,
            is_free: subscriptionName === 'free' ? 'true' : 'false',
        },
    });
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
