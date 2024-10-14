import Counter from '../lib/Counter';
import Histogram from '../lib/Histogram';
import MetricsApi from '../lib/MetricsApi';
import MetricsBase from '../lib/MetricsBase';
import MetricsRequestService from '../lib/MetricsRequestService';
import type IMetricsRequestService from '../lib/types/IMetricsRequestService';
import type MetricSchema from '../lib/types/MetricSchema';

export const counterName = 'counter_name';
export const counterVersion = 1;

export const histogramName = 'histogram_name';
export const histogramVersion = 1;

class MetricsTest extends MetricsBase {
    public counter: Counter<MetricSchema>;

    public histogram: Histogram<MetricSchema>;

    constructor(requestService: IMetricsRequestService) {
        super(requestService);

        this.counter = new Counter<MetricSchema>({ name: counterName, version: counterVersion }, this.requestService);
        this.histogram = new Histogram<MetricSchema>(
            { name: histogramName, version: histogramVersion },
            this.requestService
        );
    }
}

const metricsApi = new MetricsApi();
const metricsRequestService = new MetricsRequestService(metricsApi, { reportMetrics: true });
const metrics = new MetricsTest(metricsRequestService);

const uid = 'uid';
const clientID = 'clientID';
const appVersion = 'appVersion';

metrics.init({
    uid,
    clientID,
    appVersion,
});

const time = new Date('2020-01-01');

describe('metrics', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        fetchMock.resetMocks();
        jest.clearAllTimers();
        jest.setSystemTime(time);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    describe('counter requests', () => {
        it('uses the metrics v1 url', () => {
            metrics.counter.increment({
                foo: 'bar',
            });

            const url = fetchMock.mock.lastCall?.[0];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(url).toBe('/api/data/v1/metrics');
        });

        it('makes a post request', async () => {
            metrics.counter.increment({
                foo: 'bar',
            });

            const content = fetchMock.mock.lastCall?.[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(content?.method).toBe('post');
        });

        it('contains the correct headers', async () => {
            metrics.counter.increment({
                foo: 'bar',
            });

            const content = fetchMock.mock.lastCall?.[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(content?.headers).toEqual({
                'content-type': 'application/json',
                priority: 'u=6',
                'x-pm-appversion': `${clientID}@${appVersion}-dev`,
                'x-pm-uid': uid,
            });
        });

        it('sends the metric name', async () => {
            metrics.counter.increment({
                foo: 'bar',
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Name).toEqual(counterName);
        });

        it('sends the metric version', async () => {
            metrics.counter.increment({
                foo: 'bar',
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Version).toEqual(counterVersion);
        });

        it('uses the current time for the timestamp', async () => {
            metrics.counter.increment({
                foo: 'bar',
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Timestamp).toEqual(time.getTime() / 1000);
        });

        it('sends Value as 1', async () => {
            metrics.counter.increment({
                foo: 'bar',
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Data.Value).toBe(1);
        });

        it('sends labels', async () => {
            const labels = {
                foo: 'bar',
                bar: 'foo',
            };
            metrics.counter.increment(labels);

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Data.Labels).toEqual(labels);
        });
    });

    describe('histogram requests', () => {
        it('uses the metrics v1 url', async () => {
            metrics.histogram.observe({
                Labels: {
                    foo: 'bar',
                },
                Value: 1,
            });

            const url = fetchMock.mock.lastCall?.[0];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(url).toBe('/api/data/v1/metrics');
        });

        it('makes a post request', async () => {
            metrics.histogram.observe({
                Labels: {
                    foo: 'bar',
                },
                Value: 1,
            });

            const content = fetchMock.mock.lastCall?.[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(content?.method).toBe('post');
        });

        it('contains the correct headers', async () => {
            metrics.histogram.observe({
                Labels: {
                    foo: 'bar',
                },
                Value: 1,
            });

            const content = fetchMock.mock.lastCall?.[1];

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(content?.headers).toEqual({
                'content-type': 'application/json',
                priority: 'u=6',
                'x-pm-appversion': `${clientID}@${appVersion}-dev`,
                'x-pm-uid': uid,
            });
        });

        it('sends the metric name', async () => {
            metrics.histogram.observe({
                Labels: {
                    foo: 'bar',
                },
                Value: 1,
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Name).toEqual(histogramName);
        });

        it('sends the metric version', async () => {
            metrics.histogram.observe({
                Labels: {
                    foo: 'bar',
                },
                Value: 1,
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Version).toEqual(histogramVersion);
        });

        it('uses the current time for the timestamp', async () => {
            metrics.histogram.observe({
                Labels: {
                    foo: 'bar',
                },
                Value: 1,
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Timestamp).toEqual(time.getTime() / 1000);
        });

        it('sends float Values', async () => {
            const Value = 1.234;
            metrics.histogram.observe({
                Labels: {
                    foo: 'bar',
                },
                Value,
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Data.Value).toBe(Value);
        });

        it('sends Labels', async () => {
            const Labels = {
                foo: 'bar',
                bar: 'foo',
            };
            metrics.histogram.observe({
                Labels,
                Value: 1,
            });

            const content = fetchMock.mock.lastCall?.[1];
            // @ts-ignore
            const body = JSON.parse(content?.body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(body.Metrics[0].Data.Labels).toEqual(Labels);
        });
    });
});
