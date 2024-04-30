import { type Middleware, isAction } from 'redux';

import { selectRequest } from '@proton/pass/store/selectors';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { requestInvalidate } from './actions';
import type { RequestState } from './types';
import { isActionWithRequest } from './utils';

export const requestMiddleware: Middleware<{}, { request: RequestState }> =
    ({ getState, dispatch }) =>
    (next) => {
        return (action: unknown) => {
            if (isAction(action)) {
                if (!isActionWithRequest(action)) return next(action);

                const { request } = action.meta;
                const { status, id } = request;

                if ((status === 'success' && !request.maxAge) || status === 'failure') {
                    /** request data garbage collection : on a request success or failure,
                     * if it not persistent, dispatch an acknowledgment action in order to
                     * clear the request data for this particular request id.*/
                    setTimeout(() => dispatch(requestInvalidate(id)), 500);
                }

                if (status === 'start') {
                    if (request.revalidate) return next(action);
                    const pending = selectRequest(id)(getState());

                    switch (pending?.status) {
                        case 'start' /* if there is an ongoing `start`, omit this action */:
                            return;

                        case 'success':
                            /* if there is a request result with a `maxAge` property,
                             * skip the action if not invalidated */
                            const now = getEpoch();
                            if (pending.maxAge && pending.requestedAt + pending.maxAge > now) return;
                            else return next(action);

                        default: /* if there is no pending request, process it */
                            return next(action);
                    }
                }

                return next(action);
            }
        };
    };
