import type { Action } from 'redux';

import { type WithMeta, withMetaFactory } from './meta';

export type SynchronousActionMeta = { sync: true };
export type WithSynchronousAction<A = Action> = WithMeta<SynchronousActionMeta, A>;

export const withSynchronousAction = withMetaFactory<SynchronousActionMeta>({ sync: true });

export const isSynchronousAction = <T extends Action>(action?: T): action is WithSynchronousAction<T> =>
    (action as any)?.meta?.sync === true;
