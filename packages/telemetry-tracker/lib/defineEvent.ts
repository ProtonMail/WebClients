import type { TelemetryEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';

import type { DimensionSpec, DimensionsSpec, DurationSpec, ValueSpec, ValuesSpec } from './dimensions';
import type { TimerHandle } from './timers';

/**
 * Where an event goes:
 * - `telemetry`: Metabase, through `sendTelemetryReport` (`data/v1/stats`). Needs `group` + `event`.
 * - `analytics`: Proton analytics, through `@proton/shared/lib/telemetry` (`sendCustomEvent`). Needs `name`.
 * - `both`: the two of them. Needs `group` + `event` + `name`.
 */
type EventTarget = 'telemetry' | 'analytics' | 'both';

interface TelemetryFields {
    /** Telemetry measurement group, must be whitelisted by the backend */
    group: TelemetryMeasurementGroups;
    /** Telemetry event name, must be whitelisted by the backend */
    event: TelemetryEvents;
}

interface AnalyticsFields {
    /** Event name in Proton analytics */
    name: string;
}

export interface EventDefinition<D extends DimensionsSpec = DimensionsSpec, V extends ValuesSpec = ValuesSpec> {
    readonly target: EventTarget;
    /** Only set when the target includes `telemetry` */
    readonly group?: TelemetryMeasurementGroups;
    /** Only set when the target includes `telemetry` */
    readonly event?: TelemetryEvents;
    /** Only set when the target includes `analytics` */
    readonly name?: string;
    readonly dimensions: D;
    readonly values: V;
    /** Telemetry only: random 1-180s delay before sending, to avoid correlating the report with a user action. Default: true */
    readonly delay: boolean;
}

export const defineEvent = <
    const D extends DimensionsSpec = Record<never, DimensionSpec>,
    const V extends ValuesSpec = Record<never, ValueSpec>,
>(
    config: (
        | ({ target: 'telemetry' } & TelemetryFields & { name?: never })
        | ({ target: 'analytics' } & AnalyticsFields & { group?: never; event?: never })
        | ({ target: 'both' } & TelemetryFields & AnalyticsFields)
    ) & {
        dimensions?: D;
        values?: V;
        delay?: boolean;
    }
): EventDefinition<D, V> => ({
    target: config.target,
    group: config.group,
    event: config.event,
    name: config.name,
    dimensions: (config.dimensions ?? {}) as D,
    values: (config.values ?? {}) as V,
    delay: config.delay ?? true,
});

// Type helpers: they turn an event definition into the input expected by `tracker.emit()`.
//
// Running example:
//   defineEvent({
//       dimensions: { source: allowed(['a', 'b']), isBYOE: bool() },
//       values: { count: number(), durationMs: duration() },
//   })

/** Dimension specs -> accepted values: `{ source: 'a' | 'b'; isBYOE: boolean }` */
type DimensionsInput<D extends DimensionsSpec> = {
    [K in keyof D]: D[K] extends DimensionSpec<infer T> ? T : never;
};

/** Names of the `duration()` values: `'durationMs'` */
type DurationKeys<V extends ValuesSpec> = {
    [K in keyof V]: V[K] extends DurationSpec ? K : never;
}[keyof V];

/**
 * Value specs -> numbers, without the duration ones: `{ count: number }`.
 * Durations are never passed manually, see `EmitOptions.durationFrom`.
 */
type ValuesInput<V extends ValuesSpec> = { [K in Exclude<keyof V, DurationKeys<V>>]: number };

/** `{ [Name]: Content }`, or `unknown` (a no-op in an intersection) when there is nothing to pass */
type InputPart<Name extends string, Content> = keyof Content extends never ? unknown : { [N in Name]: Content };

/**
 * What `tracker.emit(event, input)` expects, derived from the definition. Empty parts are omitted.
 * For the running example: `{ dimensions: { source: 'a' | 'b'; isBYOE: boolean }; values: { count: number } }`
 */
export type EmitInput<E extends EventDefinition> =
    E extends EventDefinition<infer D, infer V>
        ? InputPart<'dimensions', DimensionsInput<D>> & InputPart<'values', ValuesInput<V>>
        : never;

/** Whether the event declares at least one `duration()` value */
type HasDuration<E extends EventDefinition> =
    E extends EventDefinition<DimensionsSpec, infer V> ? ([DurationKeys<V>] extends [never] ? false : true) : false;

export interface EmitOptions<E extends EventDefinition = EventDefinition> {
    /** Override the delay defined on the event */
    delay?: boolean;
    /** Flush the batch right away (e.g. before a page unload) */
    flushImmediately?: boolean;
    /**
     * Fill the event's `duration()` value with the elapsed time of this timer.
     * Only accepted by events declaring a `duration()` value.
     */
    durationFrom?: HasDuration<E> extends true ? TimerHandle : never;
    /** Remove the `durationFrom` timer after emitting, for the last step of a funnel */
    stopTimer?: boolean;
}

export type EmitArgs<E extends EventDefinition> = [unknown] extends [EmitInput<E>]
    ? [input?: undefined, options?: EmitOptions<E>]
    : [input: EmitInput<E>, options?: EmitOptions<E>];
