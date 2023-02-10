import { MetricVersions } from './Metric';
import { IMetricsApi } from './MetricsApi';

export interface MetricsRequest {
    Name: string;
    Version: MetricVersions;
    Timestamp: number;
    Data: object;
}

export interface IMetricsRequestService {
    api: IMetricsApi;
    report: (request: MetricsRequest) => void;
    startBatchingProcess: () => void;
    stopBatchingProcess: () => void;
    processAllRequests: () => Promise<void>;
    clearQueue: () => void;
    setReportMetrics: (reportMetrics: boolean) => void;
}

interface BatchOptions {
    frequency: number;
    size: number;
}

class MetricsRequestService implements IMetricsRequestService {
    public api: IMetricsApi;

    private _reportMetrics: boolean;

    private _requestQueue: MetricsRequest[];

    private _batch?: BatchOptions;

    private _intervalId: ReturnType<typeof setInterval> | null;

    constructor(
        api: IMetricsApi,
        {
            reportMetrics,
            batch,
        }: {
            reportMetrics: boolean;
            batch?: BatchOptions;
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

        if (this._batch !== undefined) {
            this.startBatchingProcess();
        }
    }

    public startBatchingProcess() {
        if (this._intervalId !== null || this._batch === undefined) {
            return;
        }

        this._intervalId = setInterval(this.processNextBatch.bind(this), this._batch.frequency);
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
        await this.makeRequest(itemsToProcess);
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
            void this.makeRequest([request]);
        } else {
            this._requestQueue.push(request);
        }
    }

    private processNextBatch() {
        if (this._batch === undefined) {
            return;
        }

        const itemsToProcess = this._requestQueue.splice(0, this._batch.size);

        if (itemsToProcess.length === 0) {
            return;
        }

        return this.makeRequest(itemsToProcess);
    }

    private makeRequest(metrics: MetricsRequest[]) {
        return this.api.fetch('api/data/v1/metrics', {
            method: 'post',
            body: JSON.stringify({ Metrics: metrics }),
        });
    }
}

export default MetricsRequestService;
