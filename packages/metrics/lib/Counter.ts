import Metric from './Metric';
import MetricSchema from './types/MetricSchema';

class Counter<D extends MetricSchema> extends Metric<D> {
    public increment(labels: D['Labels']) {
        this.addToRequestQueue({
            Value: 1,
            Labels: labels,
        } as D);
    }
}

export default Counter;
