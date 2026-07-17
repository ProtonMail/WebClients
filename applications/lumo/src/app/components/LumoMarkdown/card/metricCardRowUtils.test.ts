import { getMetricRowColumnCount } from './metricCardRowUtils';

describe('metricCardRowUtils', () => {
    it('uses one column for a single KPI', () => {
        expect(getMetricRowColumnCount(1)).toBe(1);
    });

    it('matches column count to KPI count between two and four', () => {
        expect(getMetricRowColumnCount(2)).toBe(2);
        expect(getMetricRowColumnCount(3)).toBe(3);
        expect(getMetricRowColumnCount(4)).toBe(4);
    });

    it('reserves an extra column while the next KPI is streaming', () => {
        expect(getMetricRowColumnCount(2, true)).toBe(3);
    });
});
