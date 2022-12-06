import Metric, { MetricSchema } from './Metric';

class Counter<D extends MetricSchema> extends Metric<D> {
    public async increment(labels: D['Labels']) {
        await this.post({
            Value: 1,
            Labels: labels,
        } as D);
    }
}

export default Counter;
