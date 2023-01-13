import { IMetricsRequestService } from './MetricsRequestService';

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

    private requestService: IMetricsRequestService;

    constructor(config: { name: string; version: MetricVersions }, requestService: IMetricsRequestService) {
        this.name = config.name;
        this.version = config.version;
        this.requestService = requestService;

        if (!validateMetricName(this.name)) {
            throw new Error('Invalid metric name');
        }
    }

    protected addToRequestQueue(data: D) {
        const labelNames = Object.keys(data.Labels);
        if (!validateLabelName(labelNames)) {
            /**
             * TODO: should we really throw here?
             */
            throw new Error('Invalid label name');
        }

        this.requestService.report({
            Name: this.name,
            Version: this.version,
            TimeStamp: Date.now(),
            Data: data,
        });
    }
}

export default Metric;
