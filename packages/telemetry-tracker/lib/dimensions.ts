/**
 * Builders describing the shape of a dimension or value of a telemetry event.
 * Types are carried by a phantom `_type` field so that `defineEvent` can infer the
 * input expected at `tracker.emit()` call sites.
 */
export interface DimensionSpec<T extends string | boolean = string | boolean> {
    readonly kind: 'allowed' | 'topValues' | 'bool' | 'context';
    /** Hardcoded list of accepted values (`allowed` only) */
    readonly values?: readonly string[];
    /** Type-level only, never set at runtime */
    readonly _type?: T;
}

/**
 * Dimension filled by the tracker from a context handle (see `defineContext`), never passed at the call site.
 * The `_context` brand lets `defineEvent` remove it from the emit input.
 */
export interface ContextDimensionSpec<T extends string | boolean = string | boolean> extends DimensionSpec<T> {
    readonly kind: 'context';
    readonly key: string;
    /** Read at emit time, so the value is always the latest one */
    readonly source: { get(key: string): string | boolean | undefined };
    /** Type-level only, never set at runtime */
    readonly _context: true;
}

export interface NumberSpec {
    readonly kind: 'number';
}

/** Elapsed time of a funnel timer. Only filled when the call site passes `durationFrom` to `emit`. */
export interface DurationSpec {
    readonly kind: 'duration';
}

/** Numeric value read from a context handle at emit time. */
export interface ContextValueSpec {
    readonly kind: 'contextValue';
    readonly key: string;
    readonly source: { get(key: string): number | undefined };
    readonly _context: true;
}

export type ValueSpec = NumberSpec | DurationSpec | ContextValueSpec;

export type DimensionsSpec = Record<string, DimensionSpec>;
export type ValuesSpec = Record<string, ValueSpec>;

/**
 * Dimension with a closed, hardcoded list of values (`allowed_values` in the telemetry definition).
 * @example source: allowed(['settings', 'sidebar'])
 */
export const allowed = <const V extends string>(values: readonly V[]): DimensionSpec<V> => ({
    kind: 'allowed',
    values,
});

/**
 * Dimension with free-form strings (`top_values` in the telemetry definition).
 */
export const topValues = (): DimensionSpec<string> => ({
    kind: 'topValues',
});

/**
 * Boolean dimension. Accepts a boolean in code, sent as the string 'true' | 'false'.
 */
export const bool = (): DimensionSpec<boolean> => ({
    kind: 'bool',
});

/**
 * Numerical value sent alongside the dimensions (`values` of the report).
 */
export const number = (): NumberSpec => ({ kind: 'number' });

/**
 * Duration in milliseconds of a funnel timer (e.g. `durationMs: duration()`).
 * Never sent automatically: the engineer asks for it with `emit(event, input, { durationFrom: timer })`.
 */
export const duration = (): DurationSpec => ({ kind: 'duration' });
