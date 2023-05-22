import cloneDeep from 'lodash/cloneDeep';
import type { AnyAction } from 'redux';

import { merge } from '@proton/pass/utils/object';

export type ActionCallback<T = AnyAction> = (action: T) => void;

export type WithCallback<T = AnyAction, R = AnyAction> = T & { meta: { callback?: ActionCallback<R> } };

/* type guard utility */
export const isActionWithCallback = <T extends AnyAction>(action?: T): action is WithCallback<T> =>
    (action as any)?.meta?.callback !== undefined;

const withCallback =
    <R extends AnyAction>(callback?: ActionCallback<R>) =>
    <T extends object>(action: T): WithCallback<T, R> =>
        merge(action, { meta: { callback } });

export const sanitizeWithCallbackAction = <T extends AnyAction>(action: T | WithCallback<T>): T => {
    const sanitizedAction = cloneDeep(action);
    if (isActionWithCallback(sanitizedAction)) {
        delete sanitizedAction.meta.callback;
    }

    return sanitizedAction;
};

export default withCallback;
