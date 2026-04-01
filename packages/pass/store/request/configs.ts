import type { RequestConfig } from './types';

type SuccessOption<D = never> = { config: RequestConfig<'success', D> };

/** Persisted cache: payload to reducer, entry survives reboots within TTL */
export const cachedRequest = (maxAge: number): SuccessOption<null> => ({ config: { maxAge, data: null } });
/** Session cache: payload to reducer, entry is hot (not persisted, refetched on boot) */
export const sessionRequest = (maxAge: number): SuccessOption<null> => ({ config: { maxAge, data: null, hot: true } });
/** Data: payload stored in request entry, no reducer. Read via `selectRequest(...)?.data` */
export const dataRequest = (maxAge: number): SuccessOption => ({ config: { maxAge, hot: true } });
