import type { Action } from 'redux';

import { type WithMeta, withMetaFactory } from './meta';

export type CacheMeta = { cache: boolean; throttle?: boolean };
export type WithCache<A = Action> = WithMeta<CacheMeta, A>;

export const isCachingAction = <T extends Action>(action?: T): action is WithCache<T> =>
    (action as any)?.meta?.cache === true;

export const withCache = withMetaFactory<CacheMeta>({ cache: true });
export const withCacheOptions = (options: Omit<CacheMeta, 'cache'>) => withMetaFactory({ ...options, cache: true });
export const withThrottledCache = withCacheOptions({ throttle: true });
