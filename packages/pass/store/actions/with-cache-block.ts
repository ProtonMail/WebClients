import type { AnyAction } from 'redux';

import { invert } from '@proton/pass/utils/fp/predicates';
import { merge } from '@proton/pass/utils/object/merge';

export type WithCacheBlock<T = AnyAction> = T & { meta: { cache: false } };

const isCacheBlockingAction = <T extends AnyAction>(action?: T): action is WithCacheBlock<T> =>
    (action as any)?.meta?.cache === false;

export const isCacheTriggeringAction = invert(isCacheBlockingAction);

const withCacheBlock = <T extends object>(action: T): WithCacheBlock<T> =>
    merge(action, { meta: { cache: false as const } });

export default withCacheBlock;
