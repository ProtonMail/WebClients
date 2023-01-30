import Histogram from '../lib/Histogram';
import MetricsApi from '../lib/MetricsApi';
import MetricsRequestService from '../lib/MetricsRequestService';
import { MetricSchema } from './../lib/Metric';

jest.mock('../lib/MetricsApi');
const metricsApi = new MetricsApi();

jest.mock('../lib/MetricsRequestService');
const metricsRequestService = new MetricsRequestService(metricsApi, { reportMetrics: true });

interface DefaultMetricSchema extends MetricSchema {
    Labels: {
        foo: 'bar';
    };
}

const time = new Date('2020-01-01');

describe('Histogram', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        jest.clearAllTimers();
        jest.setSystemTime(time);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('construct correct metric report', () => {
        const name = 'name';
        const version = 1;
        const counter = new Histogram<DefaultMetricSchema>({ name, version }, metricsRequestService);

        const value = 123.456;
        counter.observe({ Value: value, Labels: { foo: 'bar' } });

        expect(metricsRequestService.report).toHaveBeenCalledWith({
            Name: name,
            Version: version,
            Timestamp: time.getTime() / 1000,
            Data: {
                Value: value,
                Labels: { foo: 'bar' },
            },
        });
    });
});
