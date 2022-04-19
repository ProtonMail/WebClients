import { METRICS_LOG } from '../constants';

interface SendMetricsReportPayload {
    Log: METRICS_LOG;
    Title?: string;
    Data?: any;
}

export const metrics = ({ Log, Title, Data }: SendMetricsReportPayload) => ({
    method: 'post',
    url: 'metrics',
    data: { Log, Title, Data },
});
