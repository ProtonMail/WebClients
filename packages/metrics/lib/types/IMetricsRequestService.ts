import type IMetricsApi from './IMetricsApi';
import type MetricsRequest from './MetricsRequest';

export default interface IMetricsRequestService {
    api: IMetricsApi;
    report: (request: MetricsRequest) => void;
    startBatchingProcess: () => void;
    stopBatchingProcess: () => void;
    processAllRequests: () => Promise<void>;
    clearQueue: () => void;
    setReportMetrics: (reportMetrics: boolean) => void;
}
