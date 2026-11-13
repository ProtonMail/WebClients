import { vi } from 'vitest';

import Counter from '../lib/Counter';
import MetricsApi from '../lib/MetricsApi';
import MetricsRequestService from '../lib/MetricsRequestService';
import type MetricSchema from '../lib/types/MetricSchema';

vi.mock('../lib/MetricsApi');
const metricsApi = new MetricsApi();

vi.mock('../lib/MetricsRequestService');
const metricsRequestService = new MetricsRequestService(metricsApi, { reportMetrics: true });

interface DefaultMetricSchema extends MetricSchema {
    Labels: {
        foo: 'bar';
    };
}

const time = new Date('2020-01-01');

describe('Counter', () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    beforeEach(() => {
        vi.clearAllTimers();
        vi.setSystemTime(time);
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('construct correct metric report', () => {
        const name = 'name';
        const version = 1;
        const counter = new Counter<DefaultMetricSchema>({ name, version }, metricsRequestService);

        counter.increment({ foo: 'bar' });

        expect(metricsRequestService.report).toHaveBeenCalledWith({
            Name: name,
            Version: version,
            Timestamp: time.getTime() / 1000,
            Data: {
                Value: 1,
                Labels: { foo: 'bar' },
            },
        });
    });
});
