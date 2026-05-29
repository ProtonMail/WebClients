import type { Computed } from './types/computed';
import type { NavContext } from './types/models';

/**
 * Resolves a `Computed<T, TContext>` value against a runtime context.
 * If the value is a function it's called with `{ context }`; otherwise it's returned as-is.
 */
export function compute<T, TContext extends NavContext>(value: Computed<T, TContext>, context: TContext): T;
export function compute<T, TContext extends NavContext>(
    value: Computed<T, TContext> | undefined,
    context: TContext
): T | undefined;
export function compute(value: unknown, context: unknown) {
    return typeof value === 'function' ? (value as (args: { context: unknown }) => unknown)({ context }) : value;
}
