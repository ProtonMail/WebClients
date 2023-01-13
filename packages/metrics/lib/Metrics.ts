import { MyDataSeriesV1 } from '../types/my_data_series_v1.schema';
import { MyDataSeriesV2 } from '../types/my_data_series_v2.schema';
import Counter from './Counter';
import Histogram from './Histogram';
import MetricsApi from './MetricsApi';
import MetricsRequestService, { IMetricsRequestService } from './MetricsRequestService';

class Metrics {
    private requestService: IMetricsRequestService;

    public myDataSeriesV1: Counter<MyDataSeriesV1>;

    public myDataSeriesV2: Histogram<MyDataSeriesV2>;

    constructor(
        requestService: IMetricsRequestService = new MetricsRequestService(new MetricsApi(), {
            reportMetrics: true,
            batchTimeoutSeconds: 5,
            batchSize: 2,
        })
    ) {
        this.requestService = requestService;
        this.requestService.startBatchingProcess();


        this.myDataSeriesV1 = new Counter<MyDataSeriesV1>({ name: 'my_data_series', version: '1' }, requestService);
        this.myDataSeriesV2 = new Histogram<MyDataSeriesV2>({ name: 'my_data_series', version: '2' }, requestService);
    }

    /**
     * Allows authed metric requests
     */
    public setAuthHeaders(uid: string) {
        this.requestService.setAuthHeaders(uid);
    }

    public clearAuthHeaders() {
        this.requestService.setAuthHeaders('');
    }

    public setReportMetrics(reportMetrics: boolean) {
        this.requestService.reportMetrics = reportMetrics;
    }
}

export default Metrics;
