import type {
    Alert,
    Comparison,
    Hero,
    OrganizationWidgetId,
    Segment,
    Threshold,
    WidgetBody,
    WidgetQueryParameters,
    WidgetResponse,
    WidgetState,
} from './widgetContract';

const DAY = 24 * 60 * 60 * 1000;

const DEFAULT_RANGE_IN_DAYS = 30;

const startOfUTCDay = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** The last 30 days, today included, on day buckets: the range the dashboard opens with. */
export const getDefaultWidgetQuery = (now: Date): WidgetQueryParameters => {
    const to = startOfUTCDay(now) + DAY;
    return {
        from: new Date(to - DEFAULT_RANGE_IN_DAYS * DAY).toISOString(),
        to: new Date(to).toISOString(),
        resolution: 'day',
        compare: true,
    };
};

const getDays = ({ from, to }: WidgetQueryParameters) => {
    const days: string[] = [];
    for (let time = Date.parse(from); time < Date.parse(to); time += DAY) {
        days.push(new Date(time).toISOString());
    }
    return days;
};

const withPercentages = (segments: Omit<Segment, 'percentage'>[]): Segment[] => {
    const total = segments.reduce((sum, { value }) => sum + value, 0);
    return segments.map((segment) => ({
        ...segment,
        percentage: total === 0 ? 0 : Math.round((segment.value / total) * 1000) / 10,
    }));
};

const getComparison = (value: number, previousValue: number): Comparison => ({
    previousValue,
    delta: value - previousValue,
    deltaPct: previousValue === 0 ? null : Math.round(((value - previousValue) / previousValue) * 1000) / 10,
});

interface StubResult {
    hero: Hero | null;
    body: WidgetBody;
    alerts?: Alert[];
    comparison?: Comparison;
    threshold?: Threshold;
}

const ACTIVE_USERS = [
    92, 92, 91, 92, 91, 91, 90, 91, 92, 96, 97, 97, 97, 98, 98, 97, 97, 97, 96, 96, 96, 96, 95, 95, 95, 94, 94, 94, 95,
    94,
];
const AVAILABLE_SEATS = [8, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4];
const FAILED_SIGN_INS = [3, 4, 2, 5, 3, 4, 6, 3, 2, 5, 38, 21, 6, 4, 3, 5, 4, 2, 3, 6, 4, 3, 5, 4, 2, 3, 5, 4, 3, 5];

/** Cycles a sample over the range so a stub fills any number of days, ending on `last`. */
const fill = (days: string[], sample: number[], last: number) =>
    days.map((time, index) => ({
        time,
        value: index === days.length - 1 ? last : sample[index % sample.length],
    }));

const formatDay = (time: string) =>
    new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const stubs: Record<OrganizationWidgetId, (query: WidgetQueryParameters) => StubResult> = {
    'active-users': (query) => {
        const points = fill(getDays(query), ACTIVE_USERS, 94);
        return {
            hero: { value: 94, label: 'As of today' },
            body: { type: 'timeSeries', series: [{ name: 'Active users', points }] },
            comparison: getComparison(94, points[0].value),
        };
    },
    'inactive-users': () => ({
        hero: { value: 10, label: 'Today' },
        body: {
            type: 'breakdown',
            segments: withPercentages([
                { key: '30-59-days', label: '30 to 59 days', value: 5, meta: { admins: 1 } },
                { key: '60-89-days', label: '60 to 89 days', value: 3, meta: { admins: 1 } },
                { key: '90-days-or-more', label: '90 or more days', value: 2, meta: { admins: 0 } },
            ]),
        },
        alerts: [{ level: 'warning', code: 'inactive-90-days', message: '2 users inactive for more than 90 days' }],
    }),
    'invited-users': () => ({
        hero: { value: 15, label: 'Today' },
        body: {
            type: 'breakdown',
            segments: withPercentages([
                { key: 'under-3-days', label: 'Under 3 days', value: 8, meta: { admins: 1 } },
                { key: '3-7-days', label: '3 to 7 days', value: 4, meta: { admins: 0 } },
                { key: '7-30-days', label: '7 to 30 days', value: 2, meta: { admins: 0 } },
                { key: '30-days-or-more', label: '30+ days', value: 1, meta: { admins: 0 } },
            ]),
        },
        alerts: [{ level: 'warning', code: 'invite-pending-30-days', message: '1 user pending invite for 30+ days' }],
    }),
    'available-seats': (query) => {
        const points = fill(getDays(query), AVAILABLE_SEATS, 4);
        return {
            hero: { value: 4, label: 'Today' },
            body: { type: 'timeSeries', series: [{ name: 'Available seats', points }] },
            alerts: [{ level: 'warning', code: 'seats-unused-30-days', message: '2 seats unused for over a month' }],
            comparison: getComparison(4, points[0].value),
        };
    },
    'users-without-2fa': () => ({
        hero: { value: 26, label: 'Today' },
        body: {
            type: 'breakdown',
            segments: withPercentages([
                { key: 'users', label: 'Users', value: 22 },
                { key: 'admins', label: 'Admins', value: 3 },
                { key: 'organization-admins', label: 'Organization admins', value: 1 },
            ]),
        },
        alerts: [
            { level: 'critical', code: 'organization-admin-without-2fa', message: '1 organization admin without 2FA' },
        ],
    }),
    'failed-sign-ins': (query) => {
        const points = fill(getDays(query), FAILED_SIGN_INS, 5);
        const total = points.reduce((sum, { value }) => sum + value, 0);
        const spike = points.reduce((highest, point) => (point.value > highest.value ? point : highest));
        return {
            hero: { value: total, label: `Last ${points.length} days` },
            body: { type: 'timeSeries', series: [{ name: 'Failed sign-ins', points }] },
            alerts: [
                {
                    level: 'warning',
                    code: 'failed-sign-ins-spike',
                    message: `Unusual activity, ${formatDay(spike.time)}`,
                },
            ],
            comparison: getComparison(total, 112),
            threshold: { value: 15, higherIsBetter: false },
        };
    },
};

/**
 * What the backend would answer for `widget` and `query`, until the endpoint exists. `state` forces the
 * degraded results the ADR allows, so each card state can be rendered.
 */
export const getWidgetStub = (
    widget: OrganizationWidgetId,
    query: WidgetQueryParameters,
    state: WidgetState = 'ok'
): WidgetResponse => {
    const envelope = {
        widget,
        product: null,
        resolution: query.resolution,
        period: { from: query.from, to: query.to },
    };

    if (state === 'empty' || state === 'error') {
        return {
            ...envelope,
            state,
            updatedAt: state === 'empty' ? new Date().toISOString() : null,
            data: { hero: null, body: null },
            alerts: [],
            comparison: null,
            threshold: null,
        };
    }

    const { hero, body, alerts = [], comparison, threshold } = stubs[widget](query);
    const updatedAt = state === 'stale' ? new Date(Date.parse(query.to) - 2 * DAY) : new Date();

    return {
        ...envelope,
        state,
        updatedAt: updatedAt.toISOString(),
        data: { hero, body },
        alerts,
        comparison: query.compare ? (comparison ?? null) : null,
        threshold: threshold ?? null,
    };
};
