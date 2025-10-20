import type { Action, Reducer } from 'redux';

import { objectDelete } from '@proton/pass/utils/object/delete';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { requestInvalidate, requestProgress } from './actions';
import type { RequestState } from './types';
import { isActionWithRequest } from './utils';

const requestReducer: Reducer<RequestState> = (state = {}, action: Action) => {
    if (isActionWithRequest(action)) {
        const { request } = action.meta;
        const nextState = { ...state };

        switch (request.status) {
            case 'start': {
                nextState[request.id] = {
                    status: 'start',
                    progress: 0,
                    data: request.data,
                };

                return nextState;
            }

            case 'progress': {
                const ongoing = nextState[request.id];
                if (ongoing?.status !== 'start') return state;
                nextState[request.id] = { ...ongoing, progress: request.progress };

                return nextState;
            }

            case 'failure': {
                return objectDelete(state, request.id);
            }

            case 'success': {
                const now = getEpoch();
                if (!request.maxAge) return objectDelete(state, request.id);

                /** If there was a `maxAge` specified, store the
                 * resulting payload in the `data` field. This should
                 * ideally only be used for state not being tracked in
                 * any other reducer (HOT data) */
                nextState[request.id] = {
                    status: request.status,
                    maxAge: request.maxAge,
                    hot: request.hot ?? false,
                    requestedAt: now,
                    data: (() => {
                        if ('data' in request) return request.data;
                        if ('payload' in action) return action.payload;
                    })(),
                };

                return nextState;
            }
        }
    }

    if (requestProgress.match(action) && state[action.payload.requestId]?.status === 'start') {
        return partialMerge(state, {
            [action.payload.requestId]: { progress: action.payload.progress },
        });
    }

    if (requestInvalidate.match(action)) return objectDelete(state, action.payload.requestId);

    return state;
};

export default requestReducer;
