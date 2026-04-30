import type { RequestConfig } from '@proton/pass/store/request/types';

type SuccessOption<D> = { config: RequestConfig<'success', D> };

/**
 * NOTE: `as const` narrows the return type to its literal shape. Without it,
 * optional fields in `RequestConfig` break inference in `requestActionsFactory`
 */

/** Persisted cache: payload to reducer, entry survives reboots within TTL */
export const cachedRequest = (maxAge: number) => ({ config: { maxAge, data: null } }) as const satisfies SuccessOption<null>;
/** Session cache: payload to reducer, entry is hot (not persisted, refetched on boot) */
export const sessionRequest = (maxAge: number) => ({ config: { maxAge, data: null, hot: true } }) as const satisfies SuccessOption<null>;
/** Data: payload stored in request entry, no reducer. Read via `selectRequest(...)?.data` */
export const dataRequest = (maxAge: number) => ({ config: { maxAge, hot: true } }) as const satisfies SuccessOption<never>;
