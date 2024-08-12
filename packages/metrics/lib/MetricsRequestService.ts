import { METRICS_MAX_JAIL } from '../constants';
import type IMetricsApi from './types/IMetricsApi';
import type IMetricsRequestService from './types/IMetricsRequestService';
import type MetricsRequest from './types/MetricsRequest';

interface BatchOptions {
    frequency: number;
    size: number;
}

class MetricsRequestService implements IMetricsRequestService {
    public api: IMetricsApi;

    private _reportMetrics: boolean;

    private _requestQueue: MetricsRequest[];

    private _batch?: BatchOptions;

    private _jailMax: number;

    private _jailCount: number;

    private _intervalId: ReturnType<typeof setInterval> | null;

    constructor(
        api: IMetricsApi,
        {
            reportMetrics,
            batch,
            jailMax,
        }: {
            reportMetrics: boolean;
            batch?: BatchOptions;
            jailMax?: number;
        }
    ) {
        this.api = api;

        this._reportMetrics = reportMetrics;
        this._batch = (() => {
            if (batch === undefined) {
                return;
            }

            if (batch.frequency <= 0 || batch.size <= 0) {
                return;
            }

            return batch;
        })();

        this._requestQueue = [];
        this._intervalId = null;

        this._jailMax = (() => {
            if (jailMax === undefined) {
                return METRICS_MAX_JAIL;
            }

            if (jailMax <= 0) {
                return METRICS_MAX_JAIL;
            }

            return jailMax;
        })();
        this._jailCount = 0;
    }

    public startBatchingProcess() {
        if (this._intervalId !== null || this._batch === undefined) {
            return;
        }

        // Very naïve progressive backoff
        const frequencyWithIncrementalBackoff = (this._jailCount + 1) * this._batch.frequency;

        this._intervalId = setInterval(() => {
            this.processNextBatch();
        }, frequencyWithIncrementalBackoff);
    }

    public stopBatchingProcess() {
        if (this._intervalId === null) {
            return;
        }

        clearInterval(this._intervalId);
        this._intervalId = null;
    }

    public async processAllRequests() {
        if (this._requestQueue.length === 0) {
            return;
        }

        const itemsToProcess = this._requestQueue;
        this.clearQueue();

        try {
            await this.makeRequest(itemsToProcess);
        } catch (error) {
            this.resetBatchingProcess();
        }
    }

    public clearQueue() {
        this._requestQueue = [];
    }

    public setReportMetrics(reportMetrics: boolean) {
        this._reportMetrics = reportMetrics;
    }

    public report(request: MetricsRequest) {
        if (!this._reportMetrics) {
            return;
        }

        if (this._batch === undefined) {
            void this.makeRequest([request]).catch(() => {});
            return;
        }

        if (this._intervalId === null) {
            this.startBatchingProcess();
        }

        this._requestQueue.push(request);
    }

    private async processNextBatch() {
        if (this._batch === undefined) {
            return;
        }

        const itemsToProcess = this._requestQueue.splice(0, this._batch.size);

        if (itemsToProcess.length === 0) {
            this.stopBatchingProcess();
            return;
        }

        try {
            await this.makeRequest(itemsToProcess);
        } catch (error) {
            this.resetBatchingProcess();
        }
    }

    private async makeRequest(metrics: MetricsRequest[]) {
        if (this.isJailed()) {
            return;
        }

        try {
            await this.api.fetch('api/data/v1/metrics', {
                method: 'post',
                body: JSON.stringify({ Metrics: metrics }),
            });

            if (this._requestQueue.length === 0) {
                this.resetJailCount();
            }
        } catch (error) {
            this.incrementJailCount();
            throw error;
        }
    }

    private resetBatchingProcess() {
        this.stopBatchingProcess();
        this.startBatchingProcess();
    }

    private isJailed = () => {
        return this._jailCount >= this._jailMax;
    };

    private resetJailCount = () => {
        this._jailCount = 0;
    };

    private incrementJailCount = () => {
        this._jailCount += 1;
    };
}

export default MetricsRequestService;
