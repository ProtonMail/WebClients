import Metric from './Metric';
import MetricSchema from './types/MetricSchema';

class Counter<D extends MetricSchema> extends Metric<D> {
    public increment(labels: D['Labels'], value: number = 1) {
        this.addToRequestQueue({
            Value: value,
            Labels: labels,
        } as D);
    }
}

export default Counter;
