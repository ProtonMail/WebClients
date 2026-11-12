import type { ContextDimensionSpec, ContextValueSpec } from './dimensions';

type ContextValues = Record<string, string | boolean | number | undefined>;
type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T] &
    string;

export interface ContextHandle<T extends ContextValues> {
    /** Latest value of a key */
    get<K extends keyof T & string>(key: K): T[K];
    /** Merges new values in. Cheap: call it whenever the source (store, setting…) changes. */
    set(patch: Partial<T>): void;
    /** Back to the initial values (tests, logout) */
    reset(): void;
    /** Dimension filled with the latest value of `key` when an event is emitted, never passed at the call site */
    dimension<K extends KeysOfType<T, string | boolean>>(key: K): ContextDimensionSpec<Extract<T[K], string | boolean>>;
    /** Numeric value filled from the context when an event is emitted */
    value<K extends KeysOfType<T, number | undefined>>(key: K): ContextValueSpec;
}

/**
 * Ambient data attached to events, owned by whoever defines the handle (an app or a package), like `defineTimer`.
 * The tracker knows no key: only events using `handle.dimension()` or `handle.value()` read it, so apps never share or pollute a context.
 *
 * @example
 * export const mailContext = defineContext({ plan: 'unknown' });
 * // in an event: plan: mailContext.dimension('plan')
 * // where the value is known: mailContext.set({ plan: 'free' })
 */
export const defineContext = <T extends ContextValues>(initial: T): ContextHandle<T> => {
    let values = { ...initial };
    const dimensionSource = {
        get: (key: string) => {
            const value = values[key];
            return typeof value === 'string' || typeof value === 'boolean' ? value : undefined;
        },
    };
    const valueSource = {
        get: (key: string) => {
            const value = values[key];
            return typeof value === 'number' ? value : undefined;
        },
    };

    return {
        get: (key) => values[key],
        set: (patch) => {
            values = { ...values, ...patch };
        },
        reset: () => {
            values = { ...initial };
        },
        dimension: (key) => ({
            kind: 'context',
            key,
            source: dimensionSource,
            _context: true,
        }),
        value: (key) => ({
            kind: 'contextValue',
            key,
            source: valueSource,
            _context: true,
        }),
    };
};
