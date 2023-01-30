import Metric, { MetricSchema } from '../lib/Metric';
import MetricsApi from '../lib/MetricsApi';
import MetricsRequestService from '../lib/MetricsRequestService';

jest.mock('../lib/MetricsApi');
const metricsApi = new MetricsApi();

jest.mock('../lib/MetricsRequestService');
const metricsRequestService = new MetricsRequestService(metricsApi, { reportMetrics: true });

class MetricInstance<D extends MetricSchema> extends Metric<D> {}

interface DefaultMetricSchema extends MetricSchema {
    Labels: {
        foo: 'bar';
    };
}

describe('Metric', () => {
    it('does not throw when creating a metric with a valid name', () => {
        const validNames = ['name', 'hello_there', 'aAAa_2bB'];
        const version = 1;

        for (let i = 0; i < validNames.length; i++) {
            const name = validNames[i];

            expect(() => {
                new MetricInstance<DefaultMetricSchema>({ name, version }, metricsRequestService);
            }).not.toThrow();
        }
    });

    it('throws when creating a metric with an invalid name', () => {
        const invalidNames = [
            'ends_with_an_underscore_',
            '123_starts_with_a_number',
            'contains_special_characters!@£$%^&*()',
        ];
        const version = 1;

        for (let i = 0; i < invalidNames.length; i++) {
            const name = invalidNames[i];

            expect(() => {
                new MetricInstance<DefaultMetricSchema>({ name, version }, metricsRequestService);
            }).toThrow();
        }
    });
});
