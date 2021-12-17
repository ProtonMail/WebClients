interface SendMetricsReportPayload {
    Log: string;
    Title?: string;
    Data?: any;
}

export const sendMetricsReport = ({ Log, Title, Data }: SendMetricsReportPayload) => ({
    method: 'post',
    url: 'metrics',
    data: { Log, Title, Data },
});
