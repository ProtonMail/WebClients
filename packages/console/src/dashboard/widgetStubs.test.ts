import type { OrganizationWidgetId } from './widgetContract';
import { getDefaultWidgetQuery, getWidgetStub } from './widgetStubs';

const query = getDefaultWidgetQuery(new Date('2026-11-12T15:19:00Z'));

const widgets: OrganizationWidgetId[] = [
    'active-users',
    'inactive-users',
    'invited-users',
    'available-seats',
    'users-without-2fa',
    'failed-sign-ins',
];

describe('getDefaultWidgetQuery', () => {
    it('covers the last 30 days on day buckets, today included', () => {
        expect(query).toEqual({
            from: '2026-10-14T00:00:00.000Z',
            to: '2026-11-13T00:00:00.000Z',
            resolution: 'day',
            compare: true,
        });
    });
});

describe('getWidgetStub', () => {
    it.each(widgets)('echoes the query in the envelope of %s', (widget) => {
        const response = getWidgetStub(widget, query);

        expect(response).toMatchObject({
            widget,
            product: null,
            state: 'ok',
            resolution: 'day',
            period: { from: query.from, to: query.to },
        });
        expect(response.data.body).not.toBeNull();
    });

    it('returns one point per day bucket in a time series', () => {
        const { data } = getWidgetStub('active-users', query);

        expect(data.body?.type).toBe('timeSeries');
        if (data.body?.type === 'timeSeries') {
            const { points } = data.body.series[0];
            expect(points).toHaveLength(30);
            expect(points[0].time).toBe(query.from);
            expect(points.at(-1)?.value).toBe(data.hero?.value);
        }
    });

    it('gives breakdown percentages that add up to 100', () => {
        const { data } = getWidgetStub('users-without-2fa', query);

        if (data.body?.type !== 'breakdown') {
            throw new Error('Expected a breakdown');
        }
        const total = data.body.segments.reduce((sum, { percentage }) => sum + (percentage ?? 0), 0);
        expect(total).toBeCloseTo(100, 0);
    });

    it('leaves out the comparison when it was not asked for', () => {
        expect(getWidgetStub('active-users', query).comparison).not.toBeNull();
        expect(getWidgetStub('active-users', { ...query, compare: false }).comparison).toBeNull();
    });

    it.each(['empty', 'error'] as const)('returns no data on a %s result', (state) => {
        const response = getWidgetStub('active-users', query, state);

        expect(response.state).toBe(state);
        expect(response.data).toEqual({ hero: null, body: null });
        expect(response.alerts).toEqual([]);
    });

    it('keeps the last known data on a stale result, dated before the period ends', () => {
        const response = getWidgetStub('inactive-users', query, 'stale');

        expect(response.state).toBe('stale');
        expect(response.data.hero?.value).toBe(10);
        expect(Date.parse(response.updatedAt ?? '')).toBeLessThan(Date.parse(query.to));
    });
});
