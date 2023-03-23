import IMetricsApi from './IMetricsApi';
import MetricsRequest from './MetricsRequest';

export default interface IMetricsRequestService {
    api: IMetricsApi;
    report: (request: MetricsRequest) => void;
    startBatchingProcess: () => void;
    stopBatchingProcess: () => void;
    processAllRequests: () => Promise<void>;
    clearQueue: () => void;
    setReportMetrics: (reportMetrics: boolean) => void;
}
