/**
 * Wire shape of `GET /console/v1/widgets/{widget}` and `GET /console/v1/{product}/widgets/{widget}`,
 * as proposed in Slim-API ADR-0003 (https://gitlab.protontech.ch/ProtonMail/Slim-API/-/merge_requests/47833).
 * The ADR fixes the structure but not the casing or the name of the body discriminator: camelCase and
 * `type` are assumptions until the OpenAPI schema exists.
 */

export type WidgetState = 'ok' | 'empty' | 'stale' | 'error';

export type Resolution = 'day' | 'week' | 'month';

/** `null` for organisation-level widgets. */
export type ProductGroup = 'mail' | 'pass' | 'vpn';

export type OrganizationWidgetId =
    | 'active-users'
    | 'inactive-users'
    | 'invited-users'
    | 'available-seats'
    | 'users-without-2fa'
    | 'failed-sign-ins';

export type WidgetId = OrganizationWidgetId;

/** The client-facing query string. The organisation always comes from the session, never from here. */
export interface WidgetQueryParameters {
    /** ISO 8601, aligned on the start of a `resolution` bucket in UTC. */
    from: string;
    /** ISO 8601, aligned on the start of a `resolution` bucket in UTC, at most the end of the current one. */
    to: string;
    resolution: Resolution;
    compare?: boolean;
}

export interface Hero {
    value: number;
    label: string;
    unit?: string | null;
}

export interface SeriesPoint {
    /** ISO 8601, the start of the bucket. */
    time: string;
    value: number;
}

export interface Series {
    name: string;
    points: SeriesPoint[];
}

export interface TimeSeriesBody {
    type: 'timeSeries';
    series: Series[];
}

export interface Segment {
    key: string;
    label: string;
    value: number;
    percentage?: number | null;
    meta?: Record<string, string | number | boolean>;
}

export interface BreakdownBody {
    type: 'breakdown';
    segments: Segment[];
    /** Total rows available, when `segments` is a Top-N subset. */
    total?: number | null;
}

export interface GeoCell {
    regionCode: string;
    label: string;
    value: number;
}

export interface GeoDistributionBody {
    type: 'geo';
    cells: GeoCell[];
}

export type WidgetBody = TimeSeriesBody | BreakdownBody | GeoDistributionBody;

/** Measured on the hero value. `deltaPct` is null when `previousValue` is 0. */
export interface Comparison {
    previousValue: number;
    delta: number;
    deltaPct: number | null;
}

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface Alert {
    level: AlertLevel;
    code: string;
    message: string;
}

export interface Threshold {
    value: number;
    higherIsBetter: boolean;
}

export interface WidgetResponse {
    widget: WidgetId;
    product: ProductGroup | null;
    resolution: Resolution;
    period: { from: string; to: string };
    state: WidgetState;
    /** ISO 8601. On a `stale` result, when the last-known value was computed. */
    updatedAt: string | null;
    data: {
        hero: Hero | null;
        body: WidgetBody | null;
    };
    /** The ADR does not say whether alerts sit at the top level or under `data`. */
    alerts: Alert[];
    comparison: Comparison | null;
    threshold: Threshold | null;
}
