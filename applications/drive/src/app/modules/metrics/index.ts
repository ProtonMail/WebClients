import { Metrics } from './metrics';

/**
 * Drive global metrics module.
 *
 * Initialize it right after the user data is loaded.
 *
 * @example
 * ```ts
 * driveMetrics.init({ user: userData.user });
 * ```
 *
 * Use it to report various Drive-wide metrics.
 *
 * @example
 * ```ts
 * driveMetrics.globalErrors.markCrashError();
 * ```
 */
export const driveMetrics = new Metrics();
