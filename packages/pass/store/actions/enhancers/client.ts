import type { Action } from 'redux';

import { type WithMeta, withMetaFactory } from './meta';

export type SynchronousActionMeta = { sync: true };
export type SynchronousAction<A = Action> = WithMeta<SynchronousActionMeta, A>;

export const withSynchronousAction = withMetaFactory<SynchronousActionMeta>({ sync: true });
export const isSynchronousAction = <T extends Action>(action?: T): action is SynchronousAction<T> =>
    (action as any)?.meta?.sync === true;

export type StreamableActionMeta = { stream: true };
export type StreamableAction<A = Action> = WithMeta<SynchronousActionMeta, A>;

export const withStreamableAction = withMetaFactory<StreamableActionMeta>({ stream: true });
export const isStreamableAction = <T extends Action>(action?: T): action is StreamableAction<T> =>
    (action as any)?.meta?.stream === true;
