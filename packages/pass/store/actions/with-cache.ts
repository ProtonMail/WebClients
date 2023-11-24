import type { AnyAction } from 'redux';

import { merge } from '@proton/pass/utils/object/merge';

export type CacheOptions = { cache: boolean; throttle?: boolean };
export type WithCache<T = AnyAction> = T & { meta: CacheOptions };

export const isCachingAction = <T extends AnyAction>(action?: T): action is WithCache<T> =>
    (action as any)?.meta?.cache === true;

export const withCache = <T extends object>(action: T): WithCache<T> => merge(action, { meta: { cache: true } });

export const withCacheOptions =
    (options: Omit<CacheOptions, 'cache'>) =>
    <T extends object>(action: T): WithCache<T> =>
        merge(action, { meta: { ...options, cache: true } });

export const withThrottledCache = withCacheOptions({ throttle: true });
