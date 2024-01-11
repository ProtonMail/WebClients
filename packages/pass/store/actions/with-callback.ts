import cloneDeep from 'lodash/cloneDeep';
import type { Action } from 'redux';

import { merge } from '@proton/pass/utils/object/merge';

export type ActionCallback<T = Action> = (action: T) => void;

export type WithCallback<T = Action, R = Action> = T & { meta: { callback?: ActionCallback<R> } };

/* type guard utility */
export const isActionWithCallback = <T extends Action>(action?: T): action is WithCallback<T> =>
    (action as any)?.meta?.callback !== undefined;

const withCallback =
    <R extends Action>(callback?: ActionCallback<R>) =>
    <T extends object>(action: T): WithCallback<T, R> =>
        merge(action, { meta: { callback } });

export const sanitizeWithCallbackAction = <T extends Action>(action: T | WithCallback<T>): T => {
    const sanitizedAction = cloneDeep(action);
    if (isActionWithCallback(sanitizedAction)) {
        delete sanitizedAction.meta.callback;
    }

    return sanitizedAction;
};

export default withCallback;
