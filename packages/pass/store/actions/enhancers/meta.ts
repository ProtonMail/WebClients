import type { Action } from 'redux';

import { merge } from '@proton/pass/utils/object/merge';

export type WithMeta<T, A = Action> = A & { meta: T };

export const withMetaFactory =
    <T>(meta: T) =>
    <A extends object>(action: A): WithMeta<T, A> =>
        merge(action, { meta });
