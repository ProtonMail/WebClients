import cloneDeep from 'lodash/cloneDeep';
import type { Action } from 'redux';

import { type WithMeta, withMetaFactory } from './meta';

export type ActionCallback<A = Action> = (action: A) => void;
export type CallbackMeta<A = Action> = { callback?: ActionCallback<A> };
export type WithCallback<A = Action> = WithMeta<CallbackMeta<A>, A>;

export const withCallback = <A extends Action>(callback?: ActionCallback<A>) =>
    withMetaFactory<CallbackMeta<A>>({ callback });

export const isActionWithCallback = <T extends Action>(action?: T): action is WithCallback<T> =>
    (action as any)?.meta?.callback !== undefined;

export const sanitizeWithCallbackAction = <T extends Action>(action: T | WithCallback<T>): T => {
    const sanitizedAction = cloneDeep(action);
    if (isActionWithCallback(sanitizedAction)) delete sanitizedAction.meta.callback;
    return sanitizedAction;
};
