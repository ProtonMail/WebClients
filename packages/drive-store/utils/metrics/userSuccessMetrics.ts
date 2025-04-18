import type { Remote } from 'comlink';
import { wrap } from 'comlink';
import { v4 as uuidv4 } from 'uuid';

import type { MetricUserPlan } from '../type/MetricTypes';
import { getLocalID } from '../url/localid';
import type { MetricSharedWorkerInterface } from './types/userSuccessMetricsTypes';
import { UserAvailabilityTypes } from './types/userSuccessMetricsTypes';

let worker: SharedWorker;
let metricSharedWorker: Remote<MetricSharedWorkerInterface> | undefined = undefined;
let connectionId: string;

export const userSuccessMetrics = {
    init: () => {
        // It appears certain Mobile browsers do not support SharedWorker
        // Since these are marginal we simply omit them for now
        // Plan is to fallback to simple Workers
        // TODO: https://protonag.atlassian.net/browse/DRVWEB-4324
        if (typeof SharedWorker !== 'undefined') {
            worker = new SharedWorker(
                /* webpackChunkName: "drive-shared-metrics-worker" */
                /* webpackPrefetch: true */
                /* webpackPreload: true */
                new URL('./worker/shared-metrics.worker.ts', import.meta.url)
            );
            metricSharedWorker = wrap<MetricSharedWorkerInterface>(worker.port);
            // private app would have localID, public app would use uuidv4
            connectionId = getLocalID() || uuidv4();
            window.addEventListener('beforeunload', async () => {
                await metricSharedWorker?.disconnect(connectionId);
            });
            window.addEventListener('error', () => {
                userSuccessMetrics.mark(UserAvailabilityTypes.unhandledError);
            });
        }
    },
    mark: (type: UserAvailabilityTypes) => {
        void metricSharedWorker?.mark(connectionId, type);
    },
    setAuthHeaders: async (uid: string, accessToken?: string) => {
        await metricSharedWorker?.setAuthHeaders(connectionId, uid, accessToken);
    },
    setVersionHeaders: async (clientID: string, appVersion: string) => {
        await metricSharedWorker?.setVersionHeaders(connectionId, clientID, appVersion);
    },
    setLocalUser: async (uid: string, plan: MetricUserPlan) => {
        void metricSharedWorker?.setAuthHeaders(connectionId, uid);
        void metricSharedWorker?.setLocalUser(connectionId, uid, plan);
    },
};
