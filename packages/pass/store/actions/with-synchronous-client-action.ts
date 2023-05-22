import type { AnyAction } from 'redux';

import { merge } from '@proton/pass/utils/object';

export type WithSynchronousClientAction<T = AnyAction> = T & { meta: { sync: true } };

export const isClientSynchronousAction = <T extends AnyAction>(action?: T): action is WithSynchronousClientAction<T> =>
    (action as any)?.meta?.sync === true;

const withSynchronousClientAction = <T extends object>(action: T): WithSynchronousClientAction<T> =>
    merge(action, { meta: { sync: true as const } });

export default withSynchronousClientAction;
