import type { AnyAction } from 'redux';

import { merge } from '@proton/pass/utils/object/merge';

export type WithCache<T = AnyAction> = T & { meta: { cache: boolean; immediate?: boolean } };

export const isCachingAction = <T extends AnyAction>(action?: T): action is WithCache<T> =>
    (action as any)?.meta?.cache === true;

export const withCache = <T extends object>(action: T): WithCache<T> => merge(action, { meta: { cache: true } });

export const withCacheImmediate = <T extends object>(action: T): WithCache<T> =>
    merge(action, { meta: { cache: true, immediate: true } });
