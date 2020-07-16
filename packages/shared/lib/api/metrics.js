export const sendMetricsReport = ({ Log, ID, SomeJSON }) => ({
    method: 'post',
    url: 'metrics',
    data: { Log, ID, SomeJSON },
});

export const sendSimpleMetrics = ({ Category, Action, Label }) => ({
    method: 'get',
    url: 'metrics',
    params: { Category, Action, Label },
});
