import type { Action } from 'redux';

import type { RequestType, WithRequest } from './types';

export const isActionWithRequest = <T extends Action>(action?: T): action is WithRequest<T, RequestType, unknown> =>
    (action as any)?.meta?.request !== undefined;
