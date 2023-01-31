import { IMetricsRequestService } from './MetricsRequestService';

/**
 * Custom regex based on the following
 * - https://prometheus.io/docs/concepts/data_model/#metric-names-and-labels
 * - https://gitlab.protontech.ch/proton/be/json-schema-registry
 */
const metricRegexp = /^[a-zA-Z]+(?:_[a-zA-Z0-9]+)*$/;

function validateMetricName(name: string) {
    return metricRegexp.test(name);
}

export type MetricVersions = 1 | 2;

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
            throw new Error(`Invalid metric name ${this.name}`);
        }
    }

    protected addToRequestQueue(data: D) {
        this.requestService.report({
            Name: this.name,
            Version: this.version,
            TimeStamp: Date.now(),
            Data: data,
        });
    }
}

export default Metric;
