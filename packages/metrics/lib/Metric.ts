import { IMetricsApi } from './MetricsApi';

// These are from https://prometheus.io/docs/concepts/data_model/#metric-names-and-labels
const metricRegexp = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
const labelRegexp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function validateMetricName(name: string) {
    return metricRegexp.test(name);
}

function validateLabelName(names: string[]) {
    return names.every((name) => labelRegexp.test(name));
}

export type MetricVersions = '1' | '2';

export interface MetricSchema {
    Value: number;
    Labels: Object;
}

abstract class Metric<D extends MetricSchema> {
    private name: string;

    private version: MetricVersions;

    private api: IMetricsApi;

    constructor(config: { name: string; version: MetricVersions }, api: IMetricsApi) {
        this.name = config.name;
        this.version = config.version;
        this.api = api;

        if (!validateMetricName(this.name)) {
            throw new Error('Invalid metric name');
        }
    }

    protected async post(data: D) {
        const labelNames = Object.keys(data.Labels);
        if (!validateLabelName(labelNames)) {
            throw new Error('Invalid label name');
        }

        await this.api.fetch(`data/v1/metrics`, {
            method: 'post',
            body: JSON.stringify({
                Name: this.name,
                Version: this.version,
                TimeStamp: Date.now(),
                Data: data,
            }),
        });
    }
}

export default Metric;
