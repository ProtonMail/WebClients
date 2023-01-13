import Metric, { MetricSchema } from './Metric';

class Counter<D extends MetricSchema> extends Metric<D> {
    public increment(labels: D['Labels']) {
        this.addToRequestQueue({
            Value: 1,
            Labels: labels,
        } as D);
    }
}

export default Counter;
