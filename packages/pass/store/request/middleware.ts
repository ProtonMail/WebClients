import type { Action } from '@reduxjs/toolkit';
import { type Middleware, isAction } from 'redux';

import { selectRequest } from '@proton/pass/store/selectors';
import type { Awaiter } from '@proton/pass/utils/fp/promises';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import type { RequestAsyncResult, RequestState, RequestType, WithRequest } from './types';
import { isActionWithRequest } from './utils';

export interface RequestTracker {
    requests: Map<string, Awaiter<RequestAsyncResult>>;
    push: (requestID: string) => Awaiter<RequestAsyncResult>;
}

export type RequestAsyncAccept = (action: WithRequest<Action, RequestType, unknown>) => boolean;

type RequestMiddlewareOptions = {
    acceptAsync?: RequestAsyncAccept;
    tracker?: RequestTracker;
};

export const requestTrackerFactory = (): RequestTracker => {
    /** Map storing promise-like awaiters indexed by requestID.
     * Used to track pending requests and resolve/reject them when
     * the corresponding success/failure actions are dispatched */
    const requests = new Map<string, Awaiter<RequestAsyncResult>>();

    /** Creates a new awaiter for a given `requestID`
     * and stores it in the results map */
    const createAsyncResult = (requestID: string) => {
        const asyncResult =
            requests.get(requestID) ??
            awaiter<RequestAsyncResult>({
                onResolve: () => requests.delete(requestID),
                onReject: () => requests.delete(requestID),
            });

        requests.set(requestID, asyncResult);
        return asyncResult;
    };

    return { requests, push: createAsyncResult };
};

/** Redux middleware for managing async request lifecycles and
 * caching. Handles request deduplication, TTL-based caching,
 * and promise management. Provides a `thunk-like` API for UI
 * requests while supporting saga architecture.  */
export const requestMiddlewareFactory =
    (options?: RequestMiddlewareOptions): Middleware<{}, { request: RequestState }> =>
    ({ getState }) => {
        const tracker = options?.tracker ?? requestTrackerFactory();

        const acceptAsync: RequestAsyncAccept = (action) => {
            if (!action.meta.request.async) return false;
            return options?.acceptAsync?.(action) ?? true;
        };

        return (next) => {
            return (action: unknown) => {
                if (isAction(action)) {
                    if (!isActionWithRequest(action)) return next(action);

                    const { request } = action.meta;
                    const { status, id: requestID } = request;
                    const pending = tracker.requests.get(requestID);

                    /** Handles the start of a request :
                     * 1. Revalidation: By-passes cached result always
                     * 2. Pending request: Returns existing promise to prevent concurrent requests
                     * 3. Cached result: Skips request if within maxAge, otherwise processes normally */
                    if (status === 'start') {
                        /** Returns promises only for UI-dispatched actions (`async: true`)
                         * to match the `redux-thunk` pattern. Otherwise, returns `noop` to
                         * avoid unnecessary promise tracking. This aligns with our saga
                         * architecture while maintaining thunk-like API for UI requests. */
                        const maybePromise = (result: () => Promise<RequestAsyncResult>) =>
                            (acceptAsync(action) ? result : noop)();

                        const pendingRequest = selectRequest(requestID)(getState());

                        switch (pendingRequest?.status) {
                            case 'start': {
                                /** If a request with this ID is already pending:
                                 * - return the existing promise to avoid duplicates
                                 * - else create a new async result without processing
                                 * the action to prevent concurrent executions */
                                return maybePromise(() => tracker.push(requestID));
                            }

                            case 'success': {
                                /** For cached requests:
                                 * - check if the cached result is still valid based on `maxAge`
                                 * - if valid, return cached data without processing action
                                 * - if expired, process normally with new async result */
                                const now = getEpoch();
                                const { maxAge, requestedAt, data } = pendingRequest;
                                const cached = !request.revalidate && maxAge && requestedAt + maxAge > now;

                                if (cached) return maybePromise(async () => ({ type: 'success', data }));
                                else {
                                    const result = maybePromise(() => tracker.push(requestID));
                                    next(action);

                                    return result;
                                }
                            }

                            default: {
                                /** Start tracking before calling the next middleware to
                                 * avoid missing the pending promise if the success action
                                 * is dispatched synchronously */
                                const result = maybePromise(() => tracker.push(requestID));
                                next(action);

                                return result;
                            }
                        }
                    }

                    /** Handle request completion by resolving/rejecting the tracked promise:
                     * - For success: resolves promise with action payload
                     * - For failure: rejects promise with action payload
                     * - Cleans up by removing the tracked promise from results map */
                    if (status === 'success') {
                        pending?.resolve({
                            type: status,
                            data: 'payload' in action ? action.payload : undefined,
                        });
                    }

                    if (status === 'failure') {
                        pending?.resolve({
                            type: status,
                            data: 'payload' in action ? action.payload : undefined,
                            error: 'error' in action ? action.error : undefined,
                        });
                    }

                    return next(action);
                }
            };
        };
    };

export const requestMiddleware = requestMiddlewareFactory();
