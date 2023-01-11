import Metric, { MetricSchema } from './Metric';

class Histogram<D extends MetricSchema> extends Metric<D> {
    public async observe(data: D) {
        await this.post(data);
    }
}

export default Histogram;
