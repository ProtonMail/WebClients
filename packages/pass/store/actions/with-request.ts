import type { AnyAction } from 'redux';

import { merge } from '@proton/pass/utils/object';

export type RequestType = 'start' | 'failure' | 'success';

export type RequestOptions = {
    type: RequestType;
    id: string;
};

export type WithRequest<T = AnyAction> = T & { meta: { request: RequestOptions } };

/* type guard utility */
export const isActionWithRequest = <T extends AnyAction>(action?: T): action is WithRequest<T> =>
    (action as any)?.meta?.request !== undefined;

const withRequest =
    (request: RequestOptions) =>
    <T extends object>(action: T): WithRequest<T> =>
        merge(action, { meta: { request } });

export default withRequest;
