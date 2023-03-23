import MetricVersions from './MetricVersions';

export default interface MetricsRequest {
    Name: string;
    Version: MetricVersions;
    Timestamp: number;
    Data: object;
}
