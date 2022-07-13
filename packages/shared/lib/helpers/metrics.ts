import { metrics } from '../api/metrics';
import { METRICS_LOG, SECOND } from '../constants';
import { Api } from '../interfaces';
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
 * Send metrics report
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

export const setMetricsEnabled = (enabled: boolean) => {
    metricsEnabled = enabled;
};
