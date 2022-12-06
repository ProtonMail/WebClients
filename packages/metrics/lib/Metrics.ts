import { MyDataSeriesV1 } from '../types/my_data_series_v1.schema';
import { MyDataSeriesV2 } from '../types/my_data_series_v2.schema';
import Counter from './Counter';
import Histogram from './Histogram';
import MetricsApi, { IMetricsApi } from './MetricsApi';

class Metrics {
    private api: IMetricsApi;

    public myDataSeriesV1: Counter<MyDataSeriesV1>;

    public myDataSeriesV2: Histogram<MyDataSeriesV2>;

    constructor(api: IMetricsApi = new MetricsApi()) {
        this.api = api;
        /**
         * TODO:
         * Add batching by injecting in a queue?
         */
        this.myDataSeriesV1 = new Counter<MyDataSeriesV1>({ name: 'my_data_series', version: '1' }, api);
        this.myDataSeriesV2 = new Histogram<MyDataSeriesV2>({ name: 'my_data_series', version: '2' }, api);
    }

    /**
     * Allows authed metric requests
     */
    public setUID(uid: string) {
        this.api.setAuthHeaders(uid);
    }

    public clearUID() {
        this.api.setAuthHeaders('');
    }
}

export default Metrics;
