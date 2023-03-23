import Metric from './Metric';
import MetricSchema from './types/MetricSchema';

class Histogram<D extends MetricSchema> extends Metric<D> {
    public observe(data: D) {
        this.addToRequestQueue(data);
    }
}

export default Histogram;
