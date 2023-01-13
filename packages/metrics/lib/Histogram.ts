import Metric, { MetricSchema } from './Metric';

class Histogram<D extends MetricSchema> extends Metric<D> {
    public observe(data: D) {
        this.addToRequestQueue(data);
    }
}

export default Histogram;
