import type { AnyAction, Middleware } from 'redux';

import { isActionWithRequest } from '@proton/pass/store/actions/with-request';
import { selectRequest } from '@proton/pass/store/selectors';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { type RequestState } from '../reducers';

export const requestMiddleware: Middleware<{}, { request: RequestState }> =
    ({ getState }) =>
    (next) => {
        return (action: AnyAction) => {
            /* if no request metadata or success|failure, process action */
            if (
                !isActionWithRequest(action) ||
                action.meta.request.type !== 'start' ||
                action.meta.request.revalidate
            ) {
                return next(action);
            }

            const pending = selectRequest(action.meta.request.id)(getState());

            switch (pending?.status) {
                case 'success':
                case 'failure':
                    /* if there is a request result with a maxAge property,
                     * skip the action if not invalidated */
                    const now = getEpoch();
                    if (pending.expiresAt && pending.expiresAt > now) return;
                    else return next(action);
                case 'start':
                    return; /* if there is an ongoing `start`, omit this action */
                default: /* if there is no pending request, process it */
                    return next(action);
            }
        };
    };
