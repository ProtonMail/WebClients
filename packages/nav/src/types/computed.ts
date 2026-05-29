import type { NavContext } from './models';

/**
 * A value that may be provided statically or computed from the runtime context.
 *
 * @example to: '/dashboard'
 * @example to: ({ context }) => context.flags.includes('v2') ? '/dashboard-v2' : '/dashboard'
 */
export type Computed<T, TContext extends NavContext = NavContext> = T | ((args: { context: TContext }) => T);
